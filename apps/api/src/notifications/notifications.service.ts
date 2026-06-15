import { Injectable, NotFoundException } from '@nestjs/common';
import type { Paginated } from '@msl/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, toSkipTake } from '../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Current user's notifications, newest first (NFR-12). */
  async list(userId: string, page: number, limit: number): Promise<Paginated<unknown>> {
    const where = { userId };
    const { skip, take } = toSkipTake(page, limit);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        select: { id: true, type: true, payload: true, readAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
    ]);

    // Hide "review pending" notifications whose submission was already decided
    // (approved/rejected/duplicate) so a reviewer can't open a resolved item.
    const data = await this.dropResolvedReviewPending(rows);
    return paginate(data, total, page, limit);
  }

  private async dropResolvedReviewPending<
    T extends { type: string; payload: unknown },
  >(rows: T[]): Promise<T[]> {
    const subIds = rows
      .filter((r) => r.type === 'review_pending')
      .map((r) => (r.payload as { submissionId?: string } | null)?.submissionId)
      .filter((x): x is string => Boolean(x));
    if (subIds.length === 0) return rows;

    const subs = await this.prisma.submission.findMany({
      where: { id: { in: subIds } },
      select: { id: true, status: true },
    });
    const statusById = new Map(subs.map((s) => [s.id, s.status]));
    return rows.filter((r) => {
      if (r.type !== 'review_pending') return true;
      const sid = (r.payload as { submissionId?: string } | null)?.submissionId;
      const status = sid ? statusById.get(sid) : undefined;
      return status === 'pending' || status === 'needs_clarification';
    });
  }

  /** Count of unread notifications — drives the nav badge. */
  unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  /** Mark a single notification read; scoped to its owner (deny-by-default). */
  async markRead(id: string, userId: string): Promise<{ id: string }> {
    const found = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!found) throw new NotFoundException('Notification not found');
    await this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
    return { id };
  }

  /** Mark all of the user's notifications read. */
  async markAllRead(userId: string): Promise<{ count: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { count: res.count };
  }
}
