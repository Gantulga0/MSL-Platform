import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  actorId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          action: entry.action,
          before: toJson(entry.before),
          after: toJson(entry.after),
          ip: entry.ip ?? null,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${(err as Error).message}`);
    }
  }
}

function toJson(value: unknown): object | undefined {
  if (value === undefined || value === null) return undefined;
  return value as object;
}
