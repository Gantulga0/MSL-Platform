import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import type { Paginated } from '@msl/types';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { normalizeLemma } from '../common/normalize';
import { paginate, toSkipTake } from '../common/dto/pagination.dto';
import { decideDuplicate, type Candidate } from './dedup';
import type { CreateSubmissionDto } from './dto';

const CANDIDATE_LIMIT = 5;

export interface CheckDuplicateResult {
  lemma: string;
  isDuplicate: boolean;
  candidates: { wordId: string; lemma: string; method: string; score: number }[];
}

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  /** Configurable trigram threshold from settings (S-34), env, then default (G-4). */
  private async getThreshold(): Promise<number> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'duplicate_trigram_threshold' },
    });
    const fromDb = Number(setting?.value);
    if (setting && !Number.isNaN(fromDb)) return fromDb;
    return Number(this.config.get<string>('DUPLICATE_TRIGRAM_THRESHOLD', '0.45'));
  }

  /** Exact normalized match + pg_trgm fuzzy candidates, topic-scoped (G-4). */
  private async findCandidates(norm: string, topicId?: string): Promise<Candidate[]> {
    const exact = await this.prisma.word.findFirst({
      where: { normalizedLemma: norm, status: 'approved', deletedAt: null, ...(topicId ? { topicId } : {}) },
      select: { id: true, lemma: true },
    });

    const rows = await this.prisma.$queryRaw<Array<{ id: string; lemma: string; score: number }>>(
      Prisma.sql`
        SELECT id, lemma, similarity(normalized_lemma, ${norm}) AS score
        FROM words
        WHERE status = 'approved' AND deleted_at IS NULL
          ${topicId ? Prisma.sql`AND topic_id = ${topicId}` : Prisma.empty}
          AND normalized_lemma % ${norm}
          ${exact ? Prisma.sql`AND id <> ${exact.id}` : Prisma.empty}
        ORDER BY score DESC
        LIMIT ${CANDIDATE_LIMIT}
      `,
    );

    const candidates: Candidate[] = [];
    if (exact) candidates.push({ wordId: exact.id, lemma: exact.lemma, method: 'exact', score: 1 });
    for (const r of rows) {
      candidates.push({ wordId: r.id, lemma: r.lemma, method: 'trigram', score: Number(r.score) });
    }
    return candidates;
  }

  /** Live duplicate hint for the submit form (FR-03) — no persistence. */
  async checkDuplicate(lemma: string, topic?: string): Promise<CheckDuplicateResult> {
    const norm = normalizeLemma(lemma);
    const candidates = await this.findCandidates(norm, topic);
    const threshold = await this.getThreshold();
    return {
      lemma,
      isDuplicate: decideDuplicate(candidates, threshold).isDuplicate,
      candidates: candidates.map((c) => ({ ...c })),
    };
  }

  /** Create a word suggestion and run duplicate detection. */
  async create(
    dto: CreateSubmissionDto,
    userId: string,
  ): Promise<{ submission: unknown; duplicate: boolean; existingWord?: unknown }> {
    const norm = normalizeLemma(dto.proposedLemma);

    const submission = await this.prisma.submission.create({
      data: {
        submittedBy: userId,
        proposedLemma: dto.proposedLemma,
        normalizedLemma: norm,
        proposedDefinition: dto.proposedDefinition,
        exampleSentence: dto.exampleSentence ?? null,
        topicId: dto.topicId ?? null,
        levelId: dto.levelId ?? null,
        ageGroupId: dto.ageGroupId ?? null,
        status: 'pending',
      },
    });

    // Re-parent pre-uploaded media onto this submission.
    if (dto.mediaIds?.length) {
      await this.prisma.mediaAsset.updateMany({
        where: { id: { in: dto.mediaIds }, ownerType: 'submission', uploadedBy: userId },
        data: { ownerId: submission.id },
      });
    }

    const threshold = await this.getThreshold();
    const candidates = await this.findCandidates(norm, dto.topicId);

    if (candidates.length > 0) {
      await this.prisma.duplicateCheck.createMany({
        data: candidates.map((c) => ({
          submissionId: submission.id,
          candidateWordId: c.wordId,
          method: c.method,
          similarityScore: c.score,
          decision: c.method === 'exact' || c.score >= threshold ? 'matched' : 'distinct',
        })),
      });
    }

    const decision = decideDuplicate(candidates, threshold);
    if (decision.isDuplicate && decision.match) {
      const updated = await this.prisma.submission.update({
        where: { id: submission.id },
        data: { status: 'duplicate', duplicateOfWordId: decision.match.wordId },
      });
      // Duplicate → do not notify admins.
      await this.audit.record({
        actorId: userId,
        entityType: 'submission',
        entityId: submission.id,
        action: 'submission.duplicate',
      });
      const existingWord = await this.prisma.word.findUnique({
        where: { id: decision.match.wordId },
        select: { id: true, lemma: true, definition: true },
      });
      return { submission: updated, duplicate: true, existingWord };
    }

    // Distinct → notify admins for review.
    await this.notifyAdmins(submission.id, submission.proposedLemma);
    await this.audit.record({
      actorId: userId,
      entityType: 'submission',
      entityId: submission.id,
      action: 'submission.created',
    });
    return { submission, duplicate: false };
  }

  /** My submissions + status (FR-30). */
  async mine(userId: string, page: number, limit: number): Promise<Paginated<unknown>> {
    const where = { submittedBy: userId };
    const { skip, take } = toSkipTake(page, limit);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.submission.findMany({
        where,
        select: {
          id: true,
          proposedLemma: true,
          proposedDefinition: true,
          status: true,
          createdAt: true,
          duplicateOfWordId: true,
          resultingWordId: true,
          topic: { select: { id: true, name: true } },
          reviews: {
            select: { action: true, comment: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.submission.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  private async notifyAdmins(submissionId: string, lemma: string): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'admin', status: 'active', deletedAt: null },
      select: { id: true },
    });
    if (admins.length === 0) return;
    await this.prisma.notification.createMany({
      data: admins.map((r) => ({
        userId: r.id,
        type: 'review_pending' as const,
        payload: { submissionId, lemma },
      })),
    });
  }
}
