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
  ClarifySubmissionDto,
  EditSubmissionDto,
  RejectSubmissionDto,
} from './review.dto';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Review queue, oldest-first (priority), filtered by status (FR-22). */
  async queue(status: string, page: number, limit: number): Promise<Paginated<unknown>> {
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

  /** Submission detail + duplicate candidates + media + review history. */
  async detail(id: string): Promise<unknown> {
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

  /** Approve → publish word, version it, notify contributor (FR-04/23, NFR-06). */
  async approve(id: string, dto: ApproveSubmissionDto, reviewerId: string): Promise<{ wordId: string }> {
    const submission = await this.requireReviewable(id);
    const topicId = dto.topicId ?? submission.topicId;
    if (!topicId) throw new BadRequestException('A topic is required to approve this submission');

    const lemma = dto.lemma ?? submission.proposedLemma;
    const definition = dto.definition ?? submission.proposedDefinition;
    const normalizedLemma = normalizeLemma(lemma);

    const wordId = await this.prisma.$transaction(async (tx) => {
      const word = await tx.word.create({
        data: {
          schoolId: submission.schoolId,
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
          currentVersion: 1,
        },
      });

      // Version history / provenance (FR-23, NFR-06).
      await tx.wordVersion.create({
        data: {
          wordId: word.id,
          versionNo: 1,
          snapshot: { lemma, definition, topicId, status: 'approved' },
          changedBy: reviewerId,
          changeNote: 'Approved from submission',
        },
      });

      // Re-parent submission media onto the word + make it publicly servable.
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

  async reject(id: string, dto: RejectSubmissionDto, reviewerId: string): Promise<{ id: string }> {
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
    await this.audit.record({ actorId: reviewerId, entityType: 'submission', entityId: id, action: 'submission.reject' });
    return { id };
  }

  async clarify(id: string, dto: ClarifySubmissionDto, reviewerId: string): Promise<{ id: string }> {
    const submission = await this.requireReviewable(id);
    await this.prisma.$transaction([
      this.prisma.submission.update({ where: { id }, data: { status: 'needs_clarification' } }),
      this.prisma.review.create({
        data: { submissionId: id, reviewerId, action: 'request_clarification', comment: dto.comment },
      }),
      this.prisma.notification.create({
        data: {
          userId: submission.submittedBy,
          type: 'clarification',
          payload: { submissionId: id, lemma: submission.proposedLemma, comment: dto.comment },
        },
      }),
    ]);
    await this.audit.record({ actorId: reviewerId, entityType: 'submission', entityId: id, action: 'submission.clarify' });
    return { id };
  }

  async edit(id: string, dto: EditSubmissionDto, reviewerId: string): Promise<{ id: string }> {
    const before = await this.requireReviewable(id);
    const after = await this.prisma.submission.update({
      where: { id },
      data: {
        ...(dto.proposedLemma ? { proposedLemma: dto.proposedLemma } : {}),
        ...(dto.proposedDefinition ? { proposedDefinition: dto.proposedDefinition } : {}),
        ...(dto.exampleSentence !== undefined ? { exampleSentence: dto.exampleSentence } : {}),
        ...(dto.topicId ? { topicId: dto.topicId } : {}),
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
    await this.audit.record({ actorId: reviewerId, entityType: 'submission', entityId: id, action: 'submission.edit' });
    return { id };
  }

  async batchApprove(ids: string[], reviewerId: string): Promise<{ approved: string[]; failed: string[] }> {
    const approved: string[] = [];
    const failed: string[] = [];
    for (const id of ids) {
      try {
        await this.approve(id, {}, reviewerId);
        approved.push(id);
      } catch {
        failed.push(id);
      }
    }
    return { approved, failed };
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
