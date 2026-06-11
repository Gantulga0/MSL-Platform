import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { Paginated } from '@msl/types';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { paginate, toSkipTake } from '../common/dto/pagination.dto';
import { normalizeLemma } from '../common/normalize';
import type {
  ApproveSubmissionDto,
  EditSubmissionDto,
  RejectSubmissionDto,
} from '../submissions/review.dto';
import type { CreateWordDto, UpdateWordDto, AdminWordsQueryDto } from './dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async dashboard(): Promise<Record<string, number>> {
    const [totalWords, approvedWords, pending, duplicates, rejected, activeUsers, gameSessions] =
      await this.prisma.$transaction([
        this.prisma.word.count({ where: { deletedAt: null } }),
        this.prisma.word.count({ where: { status: 'approved', deletedAt: null } }),
        this.prisma.submission.count({ where: { status: 'pending' } }),
        this.prisma.submission.count({ where: { status: 'duplicate' } }),
        this.prisma.submission.count({ where: { status: 'rejected' } }),
        this.prisma.user.count({ where: { status: 'active', deletedAt: null } }),
        this.prisma.gameSession.count(),
      ]);
    return { totalWords, approvedWords, pending, duplicates, rejected, activeUsers, gameSessions };
  }

  async reportsSummary(): Promise<Record<string, number>> {
    const [totalSubmissions, approved, duplicates, rejected, viewsAgg, sessions] =
      await this.prisma.$transaction([
        this.prisma.submission.count(),
        this.prisma.submission.count({ where: { status: 'approved' } }),
        this.prisma.submission.count({ where: { status: 'duplicate' } }),
        this.prisma.submission.count({ where: { status: 'rejected' } }),
        this.prisma.word.aggregate({ _sum: { viewCount: true } }),
        this.prisma.gameSession.count(),
      ]);
    const approvedPercent = totalSubmissions ? Math.round((approved / totalSubmissions) * 100) : 0;
    return {
      totalSubmissions,
      approved,
      duplicates,
      rejected,
      approvedPercent,
      totalWordViews: viewsAgg._sum.viewCount ?? 0,
      gameSessions: sessions,
    };
  }

  listSettings(): Promise<{ key: string; value: unknown }[]> {
    return this.prisma.setting.findMany({
      select: { key: true, value: true },
      orderBy: { key: 'asc' },
    }) as Promise<{ key: string; value: unknown }[]>;
  }

  async updateSetting(
    dto: { key: string; value: unknown },
    actorId: string,
  ): Promise<{ key: string; value: unknown }> {
    const row = await this.prisma.setting.upsert({
      where: { key: dto.key },
      update: { value: dto.value as object, updatedBy: actorId },
      create: { key: dto.key, value: dto.value as object, updatedBy: actorId },
      select: { key: true, value: true },
    });
    return row;
  }

  async listConsents(page: number, limit: number): Promise<Paginated<unknown>> {
    const { skip, take } = toSkipTake(page, limit);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.consent.findMany({ orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.consent.count(),
    ]);
    return paginate(data, total, page, limit);
  }

  async listAuditLogs(query: {
    entityType?: string;
    page: number;
    limit: number;
  }): Promise<Paginated<unknown>> {
    const where = query.entityType ? { entityType: query.entityType } : {};
    const { skip, take } = toSkipTake(query.page, query.limit);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  /** Paginated word list for admin management. */
  async listWords(query: AdminWordsQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.WordWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
    };
    if (query.q?.trim()) {
      const norm = normalizeLemma(query.q);
      where.OR = [
        { lemma: { contains: query.q.trim(), mode: 'insensitive' } },
        { definition: { contains: query.q.trim(), mode: 'insensitive' } },
        { normalizedLemma: { contains: norm } },
      ];
    }
    const { skip, take } = toSkipTake(query.page, query.limit);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.word.findMany({
        where,
        select: {
          id: true,
          lemma: true,
          definition: true,
          exampleSentence: true,
          status: true,
          viewCount: true,
          createdAt: true,
          topic: { select: { id: true, name: true } },
        },
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.word.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  /** Direct word creation — bypasses submission flow. */
  async createWord(dto: CreateWordDto, actorId: string): Promise<{ id: string }> {
    const word = await this.prisma.word.create({
      data: {
        lemma: dto.lemma,
        normalizedLemma: normalizeLemma(dto.lemma),
        definition: dto.definition,
        exampleSentence: dto.exampleSentence ?? null,
        topicId: dto.topicId,
        levelId: dto.levelId ?? null,
        ageGroupId: dto.ageGroupId ?? null,
        handshapeId: dto.handshapeId ?? null,
        handCount: dto.handCount ?? null,
        status: 'approved',
        source: dto.source ?? 'admin',
        createdBy: actorId,
        approvedBy: actorId,
        approvedAt: new Date(),
      },
    });
    await this.audit.record({
      actorId,
      entityType: 'word',
      entityId: word.id,
      action: 'word.create',
      after: { lemma: word.lemma, status: word.status },
    });
    return { id: word.id };
  }

  async updateWord(id: string, dto: UpdateWordDto, actorId: string): Promise<{ id: string }> {
    const before = await this.prisma.word.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException('Word not found');

    const data: Prisma.WordUpdateInput = {};
    if (dto.lemma !== undefined) {
      data.lemma = dto.lemma;
      data.normalizedLemma = normalizeLemma(dto.lemma);
    }
    if (dto.definition !== undefined) data.definition = dto.definition;
    if (dto.exampleSentence !== undefined) data.exampleSentence = dto.exampleSentence;
    if (dto.topicId !== undefined) data.topic = { connect: { id: dto.topicId } };
    if (dto.levelId !== undefined) {
      data.level = dto.levelId ? { connect: { id: dto.levelId } } : { disconnect: true };
    }
    if (dto.ageGroupId !== undefined) {
      data.ageGroup = dto.ageGroupId ? { connect: { id: dto.ageGroupId } } : { disconnect: true };
    }
    if (dto.handshapeId !== undefined) {
      data.handshape = dto.handshapeId ? { connect: { id: dto.handshapeId } } : { disconnect: true };
    }
    if (dto.handCount !== undefined) data.handCount = dto.handCount;
    if (dto.status !== undefined) data.status = dto.status;

    const after = await this.prisma.word.update({ where: { id }, data });
    await this.audit.record({
      actorId,
      entityType: 'word',
      entityId: id,
      action: 'word.update',
      before: { lemma: before.lemma, status: before.status },
      after: { lemma: after.lemma, status: after.status },
    });
    return { id };
  }

  async deleteWord(id: string, actorId: string): Promise<{ id: string }> {
    const word = await this.prisma.word.findFirst({ where: { id, deletedAt: null } });
    if (!word) throw new NotFoundException('Word not found');
    await this.prisma.word.update({
      where: { id },
      data: { status: 'archived', deletedAt: new Date() },
    });
    await this.audit.record({
      actorId,
      entityType: 'word',
      entityId: id,
      action: 'word.delete',
      before: { lemma: word.lemma, status: word.status },
    });
    return { id };
  }

  /** Submission review queue, oldest-first. */
  async submissionQueue(status: string, page: number, limit: number): Promise<Paginated<unknown>> {
    const where: Prisma.SubmissionWhereInput = { status: status as Prisma.SubmissionWhereInput['status'] };
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
          topic: { select: { id: true, name: true } },
          submitter: { select: { displayName: true, isMinor: true } },
          _count: { select: { duplicateChecks: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take,
      }),
      this.prisma.submission.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async submissionDetail(id: string): Promise<unknown> {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        topic: { select: { id: true, name: true } },
        level: { select: { id: true, label: true } },
        ageGroup: { select: { id: true, label: true } },
        submitter: { select: { displayName: true, isMinor: true } },
        reviews: {
          select: { action: true, comment: true, createdAt: true, reviewer: { select: { displayName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        duplicateChecks: {
          select: {
            method: true,
            similarityScore: true,
            decision: true,
            candidate: { select: { id: true, lemma: true, definition: true } },
          },
          orderBy: { similarityScore: 'desc' },
        },
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    const media = await this.prisma.mediaAsset.findMany({
      where: { ownerType: 'submission', ownerId: id },
      select: { id: true, type: true, mime: true },
    });
    return { ...submission, media };
  }

  async approveSubmission(
    id: string,
    dto: ApproveSubmissionDto,
    reviewerId: string,
  ): Promise<{ wordId: string }> {
    const submission = await this.requireReviewable(id);
    const topicId = dto.topicId ?? submission.topicId;
    if (!topicId) throw new BadRequestException('A topic is required to approve this submission');

    const lemma = dto.lemma ?? submission.proposedLemma;
    const definition = dto.definition ?? submission.proposedDefinition;
    // Published words must carry a text definition (G-15) — the public submit
    // form only collects a name + video, so the reviewer supplies it here.
    if (!definition.trim()) {
      throw new BadRequestException('A definition is required to approve this submission');
    }
    const normalizedLemma = normalizeLemma(lemma);

    const wordId = await this.prisma.$transaction(async (tx) => {
      const word = await tx.word.create({
        data: {
          lemma,
          normalizedLemma,
          definition,
          exampleSentence: dto.exampleSentence ?? submission.exampleSentence,
          topicId,
          levelId: dto.levelId ?? submission.levelId,
          ageGroupId: dto.ageGroupId ?? submission.ageGroupId,
          status: 'approved',
          source: 'submission',
          createdBy: submission.submittedBy,
          approvedBy: reviewerId,
          approvedAt: new Date(),
        },
      });

      const media = await tx.mediaAsset.findMany({
        where: { ownerType: 'submission', ownerId: id },
        select: { id: true },
      });
      for (const m of media) {
        await tx.mediaAsset.update({
          where: { id: m.id },
          data: { ownerType: 'word', ownerId: word.id, publicUrl: `/api/v1/media/${m.id}/blob` },
        });
      }

      await tx.submission.update({
        where: { id },
        data: { status: 'approved', resultingWordId: word.id },
      });
      await tx.review.create({
        data: { submissionId: id, reviewerId, action: 'approve', comment: dto.comment ?? null },
      });
      await tx.notification.create({
        data: {
          userId: submission.submittedBy,
          type: 'approved',
          payload: { submissionId: id, wordId: word.id, lemma },
        },
      });
      return word.id;
    });

    await this.audit.record({
      actorId: reviewerId,
      entityType: 'submission',
      entityId: id,
      action: 'submission.approve',
      after: { wordId },
    });
    return { wordId };
  }

  async rejectSubmission(
    id: string,
    dto: RejectSubmissionDto,
    reviewerId: string,
  ): Promise<{ id: string }> {
    const submission = await this.requireReviewable(id);
    await this.prisma.$transaction([
      this.prisma.submission.update({ where: { id }, data: { status: 'rejected' } }),
      this.prisma.review.create({
        data: { submissionId: id, reviewerId, action: 'reject', comment: dto.comment ?? null },
      }),
      this.prisma.notification.create({
        data: {
          userId: submission.submittedBy,
          type: 'rejected',
          payload: { submissionId: id, lemma: submission.proposedLemma, comment: dto.comment ?? null },
        },
      }),
    ]);
    await this.audit.record({
      actorId: reviewerId,
      entityType: 'submission',
      entityId: id,
      action: 'submission.reject',
    });
    return { id };
  }

  async editSubmission(id: string, dto: EditSubmissionDto, reviewerId: string): Promise<{ id: string }> {
    const before = await this.requireReviewable(id);
    const after = await this.prisma.submission.update({
      where: { id },
      data: {
        ...(dto.proposedLemma ? { proposedLemma: dto.proposedLemma, normalizedLemma: normalizeLemma(dto.proposedLemma) } : {}),
        ...(dto.proposedDefinition ? { proposedDefinition: dto.proposedDefinition } : {}),
        ...(dto.exampleSentence !== undefined ? { exampleSentence: dto.exampleSentence } : {}),
        ...(dto.topicId ? { topicId: dto.topicId } : {}),
        ...(dto.levelId !== undefined ? { levelId: dto.levelId } : {}),
        ...(dto.ageGroupId !== undefined ? { ageGroupId: dto.ageGroupId } : {}),
      },
    });
    await this.prisma.review.create({
      data: {
        submissionId: id,
        reviewerId,
        action: 'edit',
        beforeSnapshot: { lemma: before.proposedLemma, definition: before.proposedDefinition },
        afterSnapshot: { lemma: after.proposedLemma, definition: after.proposedDefinition },
      },
    });
    await this.audit.record({
      actorId: reviewerId,
      entityType: 'submission',
      entityId: id,
      action: 'submission.edit',
    });
    return { id };
  }

  async batchApproveSubmissions(
    ids: string[],
    reviewerId: string,
  ): Promise<{ approved: string[]; failed: string[] }> {
    const approved: string[] = [];
    const failed: string[] = [];
    for (const id of ids) {
      try {
        await this.approveSubmission(id, {}, reviewerId);
        approved.push(id);
      } catch {
        failed.push(id);
      }
    }
    return { approved, failed };
  }

  async bulkImport(
    dto: { status: 'pending' | 'approved'; words: Array<{ lemma: string; definition: string; exampleSentence?: string; topicSlug?: string }> },
    actorId: string,
  ): Promise<{ total: number; success: number; errors: { row: number; reason: string }[] }> {
    const errors: { row: number; reason: string }[] = [];
    let success = 0;

    const slugs = [...new Set(dto.words.map((w) => w.topicSlug).filter(Boolean) as string[])];
    const topics = await this.prisma.topic.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, slug: true },
    });
    const topicBySlug = new Map(topics.map((t) => [t.slug, t.id]));
    const fallback = await this.prisma.topic.findFirst({
      orderBy: { sortOrder: 'asc' },
      select: { id: true },
    });

    for (let i = 0; i < dto.words.length; i++) {
      const w = dto.words[i];
      const topicId = (w.topicSlug && topicBySlug.get(w.topicSlug)) || fallback?.id;
      if (!topicId) {
        errors.push({ row: i + 1, reason: 'No topic available' });
        continue;
      }
      try {
        await this.prisma.word.create({
          data: {
            lemma: w.lemma,
            normalizedLemma: normalizeLemma(w.lemma),
            definition: w.definition,
            exampleSentence: w.exampleSentence ?? null,
            topicId,
            status: dto.status,
            source: 'import',
            createdBy: actorId,
            ...(dto.status === 'approved' ? { approvedBy: actorId, approvedAt: new Date() } : {}),
          },
        });
        success++;
      } catch (e) {
        errors.push({ row: i + 1, reason: (e as Error).message });
      }
    }

    await this.prisma.importJob.create({
      data: {
        createdBy: actorId,
        sourceFilename: 'api-json',
        totalRows: dto.words.length,
        successRows: success,
        errorRows: errors.length,
        errors: errors.length ? errors : undefined,
        status: errors.length === dto.words.length ? 'failed' : 'completed',
      },
    });

    return { total: dto.words.length, success, errors };
  }

  private async requireReviewable(id: string) {
    const submission = await this.prisma.submission.findUnique({ where: { id } });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.status === 'approved' || submission.status === 'rejected') {
      throw new BadRequestException(`Submission is already ${submission.status}`);
    }
    return submission;
  }
}
