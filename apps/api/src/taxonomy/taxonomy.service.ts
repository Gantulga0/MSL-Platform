import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AgeGroup, Level, Topic } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateAgeGroupDto,
  CreateLevelDto,
  CreateTopicDto,
  UpdateAgeGroupDto,
  UpdateLevelDto,
  UpdateTopicDto,
} from './dto';

export interface TopicNode extends Topic {
  children: TopicNode[];
}

/** Builds a nested topic tree from a flat, sorted list (pure → unit-testable). */
export function buildTopicTree(topics: Topic[]): TopicNode[] {
  const byId = new Map<string, TopicNode>();
  for (const t of topics) byId.set(t.id, { ...t, children: [] });
  const roots: TopicNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Topics ───────────────────────────────────────────────────────────────
  async topicTree(): Promise<TopicNode[]> {
    const topics = await this.prisma.topic.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return buildTopicTree(topics);
  }

  async createTopic(dto: CreateTopicDto): Promise<Topic> {
    if (dto.parentId) await this.ensureTopic(dto.parentId);
    await this.ensureUniqueSlug(dto.slug);
    return this.prisma.topic.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        parentId: dto.parentId ?? null,
        description: dto.description ?? null,
        icon: dto.icon ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateTopic(id: string, dto: UpdateTopicDto): Promise<Topic> {
    await this.ensureTopic(id);
    if (dto.parentId === id) throw new ConflictException('A topic cannot be its own parent');
    if (dto.slug) await this.ensureUniqueSlug(dto.slug, id);
    return this.prisma.topic.update({ where: { id }, data: dto });
  }

  async deleteTopic(id: string): Promise<{ id: string }> {
    await this.ensureTopic(id);
    const [children, words] = await Promise.all([
      this.prisma.topic.count({ where: { parentId: id } }),
      this.prisma.word.count({ where: { topicId: id } }),
    ]);
    if (children > 0) throw new ConflictException('Remove or reassign child topics first');
    if (words > 0) throw new ConflictException('Topic still has words assigned');
    await this.prisma.topic.delete({ where: { id } });
    return { id };
  }

  // ── Levels ───────────────────────────────────────────────────────────────
  listLevels(): Promise<Level[]> {
    return this.prisma.level.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  createLevel(dto: CreateLevelDto): Promise<Level> {
    return this.prisma.level.create({
      data: { code: dto.code, label: dto.label, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  async updateLevel(id: string, dto: UpdateLevelDto): Promise<Level> {
    await this.ensure(this.prisma.level.findUnique({ where: { id } }), 'Level');
    return this.prisma.level.update({ where: { id }, data: dto });
  }

  async deleteLevel(id: string): Promise<{ id: string }> {
    await this.ensure(this.prisma.level.findUnique({ where: { id } }), 'Level');
    await this.prisma.level.delete({ where: { id } });
    return { id };
  }

  // ── Age groups ─────────────────────────────────────────────────────────────
  listAgeGroups(): Promise<AgeGroup[]> {
    return this.prisma.ageGroup.findMany({ orderBy: { minAge: 'asc' } });
  }

  createAgeGroup(dto: CreateAgeGroupDto): Promise<AgeGroup> {
    return this.prisma.ageGroup.create({
      data: {
        code: dto.code,
        label: dto.label,
        minAge: dto.minAge ?? null,
        maxAge: dto.maxAge ?? null,
      },
    });
  }

  async updateAgeGroup(id: string, dto: UpdateAgeGroupDto): Promise<AgeGroup> {
    await this.ensure(this.prisma.ageGroup.findUnique({ where: { id } }), 'Age group');
    return this.prisma.ageGroup.update({ where: { id }, data: dto });
  }

  async deleteAgeGroup(id: string): Promise<{ id: string }> {
    await this.ensure(this.prisma.ageGroup.findUnique({ where: { id } }), 'Age group');
    await this.prisma.ageGroup.delete({ where: { id } });
    return { id };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private async ensureTopic(id: string): Promise<Topic> {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) throw new NotFoundException('Topic not found');
    return topic;
  }

  private async ensureUniqueSlug(slug: string, exceptId?: string): Promise<void> {
    const existing = await this.prisma.topic.findUnique({ where: { slug } });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException('Slug already in use');
    }
  }

  private async ensure<T>(query: Promise<T | null>, label: string): Promise<T> {
    const row = await query;
    if (!row) throw new NotFoundException(`${label} not found`);
    return row;
  }
}
