import { Injectable } from '@nestjs/common';
import type { Paginated } from '@msl/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, toSkipTake } from '../common/dto/pagination.dto';
import { normalizeLemma } from '../common/normalize';
import type { AuditQueryDto, BulkImportDto, UpdateSettingDto } from './dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** KPI summary (FR-06, S-25). */
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

  /** Reports: approved %, duplicate/rejected, usage (FR-25, S-32). */
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
    return this.prisma.setting.findMany({ select: { key: true, value: true }, orderBy: { key: 'asc' } }) as Promise<
      { key: string; value: unknown }[]
    >;
  }

  async updateSetting(dto: UpdateSettingDto, actorId: string): Promise<{ key: string; value: unknown }> {
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

  async listAuditLogs(query: AuditQueryDto): Promise<Paginated<unknown>> {
    const where = query.entityType ? { entityType: query.entityType } : {};
    const { skip, take } = toSkipTake(query.page, query.limit);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  /** Bulk import words (CSV/JSON), pending or pre-approved (G-13, S-29). */
  async bulkImport(
    dto: BulkImportDto,
    actorId: string,
  ): Promise<{ total: number; success: number; errors: { row: number; reason: string }[] }> {
    const errors: { row: number; reason: string }[] = [];
    let success = 0;

    // Resolve topic slugs up front.
    const slugs = [...new Set(dto.words.map((w) => w.topicSlug).filter(Boolean) as string[])];
    const topics = await this.prisma.topic.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
    const topicBySlug = new Map(topics.map((t) => [t.slug, t.id]));
    // Fallback topic (first root) for rows without a valid slug.
    const fallback = await this.prisma.topic.findFirst({ orderBy: { sortOrder: 'asc' }, select: { id: true } });

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
}
