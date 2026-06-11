import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AgeGroup, Handshape, Level, SignLocation, SignMovement, Topic } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateAgeGroupDto,
  CreateHandshapeDto,
  CreateLevelDto,
  CreateSignLocationDto,
  CreateSignMovementDto,
  CreateTopicDto,
  UpdateAgeGroupDto,
  UpdateHandshapeDto,
  UpdateLevelDto,
  UpdateSignLocationDto,
  UpdateSignMovementDto,
  UpdateTopicDto,
} from './dto';

export interface TopicNode extends Topic {
  /** Approved, non-deleted words in this node plus the whole subtree below it. */
  wordCount: number;
  children: TopicNode[];
}

export function buildTopicTree(topics: Topic[]): TopicNode[] {
  const byId = new Map<string, TopicNode>();
  for (const t of topics) byId.set(t.id, { ...t, wordCount: 0, children: [] });
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

/**
 * Roll the per-topic `ownCounts` up the tree in place: each node's `wordCount`
 * becomes its own approved words plus the sum of its descendants' counts.
 * Returns the total for the given level so parents can accumulate it.
 */
export function rollUpWordCounts(
  nodes: TopicNode[],
  ownCounts: Map<string, number>,
): number {
  let total = 0;
  for (const node of nodes) {
    const own = ownCounts.get(node.id) ?? 0;
    node.wordCount = own + rollUpWordCounts(node.children, ownCounts);
    total += node.wordCount;
  }
  return total;
}

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  async topicTree(): Promise<TopicNode[]> {
    // One ordered fetch for the tree shape + one groupBy for counts — no N+1.
    const [topics, grouped] = await Promise.all([
      this.prisma.topic.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.word.groupBy({
        by: ['topicId'],
        where: { status: 'approved', deletedAt: null },
        _count: { _all: true },
      }),
    ]);
    const ownCounts = new Map<string, number>();
    for (const g of grouped) ownCounts.set(g.topicId, g._count._all);
    const roots = buildTopicTree(topics);
    rollUpWordCounts(roots, ownCounts);
    return roots;
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

  listSignLocations(): Promise<SignLocation[]> {
    return this.prisma.signLocation.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  createSignLocation(dto: CreateSignLocationDto): Promise<SignLocation> {
    return this.prisma.signLocation.create({
      data: { code: dto.code, label: dto.label, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  async updateSignLocation(id: string, dto: UpdateSignLocationDto): Promise<SignLocation> {
    await this.ensure(this.prisma.signLocation.findUnique({ where: { id } }), 'Sign location');
    return this.prisma.signLocation.update({ where: { id }, data: dto });
  }

  async deleteSignLocation(id: string): Promise<{ id: string }> {
    await this.ensure(this.prisma.signLocation.findUnique({ where: { id } }), 'Sign location');
    await this.prisma.signLocation.delete({ where: { id } });
    return { id };
  }

  listSignMovements(): Promise<SignMovement[]> {
    return this.prisma.signMovement.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  createSignMovement(dto: CreateSignMovementDto): Promise<SignMovement> {
    return this.prisma.signMovement.create({
      data: { code: dto.code, label: dto.label, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  async updateSignMovement(id: string, dto: UpdateSignMovementDto): Promise<SignMovement> {
    await this.ensure(this.prisma.signMovement.findUnique({ where: { id } }), 'Sign movement');
    return this.prisma.signMovement.update({ where: { id }, data: dto });
  }

  async deleteSignMovement(id: string): Promise<{ id: string }> {
    await this.ensure(this.prisma.signMovement.findUnique({ where: { id } }), 'Sign movement');
    await this.prisma.signMovement.delete({ where: { id } });
    return { id };
  }

  listHandshapes(): Promise<Handshape[]> {
    return this.prisma.handshape.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  createHandshape(dto: CreateHandshapeDto): Promise<Handshape> {
    return this.prisma.handshape.create({
      data: { code: dto.code, label: dto.label, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  async updateHandshape(id: string, dto: UpdateHandshapeDto): Promise<Handshape> {
    await this.ensure(this.prisma.handshape.findUnique({ where: { id } }), 'Handshape');
    return this.prisma.handshape.update({ where: { id }, data: dto });
  }

  async deleteHandshape(id: string): Promise<{ id: string }> {
    await this.ensure(this.prisma.handshape.findUnique({ where: { id } }), 'Handshape');
    await this.prisma.handshape.delete({ where: { id } });
    return { id };
  }

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
