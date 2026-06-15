import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, toSkipTake } from '../common/dto/pagination.dto';
import { normalizeLemma } from '../common/normalize';
import type { Paginated } from '@msl/types';
import type { WordsQueryDto } from './words.query.dto';

const LIST_SELECT = {
  id: true,
  lemma: true,
  definition: true,
  exampleSentence: true,
  status: true,
  handCount: true,
  topic: { select: { id: true, name: true, slug: true } },
  level: { select: { id: true, code: true, label: true } },
  ageGroup: { select: { id: true, code: true, label: true } },
} satisfies Prisma.WordSelect;

@Injectable()
export class WordsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: WordsQueryDto): Promise<Paginated<unknown>> {
    const { page, limit, q, topic, level, age, hands } = query;
    const where: Prisma.WordWhereInput = {
      status: 'approved',
      deletedAt: null,
      ...(topic ? { topicId: topic } : {}),
      ...(level ? { levelId: level } : {}),
      ...(age ? { ageGroupId: age } : {}),
      ...(hands ? { handCount: hands } : {}),
    };
    if (q && q.trim()) {
      const norm = normalizeLemma(q);
      where.OR = [
        { lemma: { contains: q.trim(), mode: 'insensitive' } },
        { definition: { contains: q.trim(), mode: 'insensitive' } },
        { normalizedLemma: { contains: norm } },
      ];
    }

    const { skip, take } = toSkipTake(page, limit);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.word.findMany({
        where,
        select: LIST_SELECT,
        orderBy: [{ lemma: 'asc' }],
        skip,
        take,
      }),
      this.prisma.word.count({ where }),
    ]);

    // Attach each word's sign video so cards can play it on hover (one query, no N+1).
    const ids = data.map((w) => w.id);
    const videos = ids.length
      ? await this.prisma.mediaAsset.findMany({
          where: { ownerType: 'word', ownerId: { in: ids }, type: 'video' },
          select: { ownerId: true, publicUrl: true },
        })
      : [];
    const videoByWord = new Map(videos.map((v) => [v.ownerId, v.publicUrl]));
    const withVideo = data.map((w) => {
      const url = videoByWord.get(w.id);
      return { ...w, video: url ? { url } : null };
    });
    return paginate(withVideo, total, page, limit);
  }

  async detail(id: string): Promise<unknown> {
    const word = await this.prisma.word.findFirst({
      where: { id, status: 'approved', deletedAt: null },
      select: {
        ...LIST_SELECT,
        // Override topic to also carry its parent so the UI can show the parent
        // as CATEGORY and the child as a TAG (the word belongs to both).
        topic: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
        source: true,
        createdAt: true,
        variants: {
          select: {
            id: true,
            label: true,
            description: true,
            region: true,
            isPrimary: true,
          },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });
    if (!word) throw new NotFoundException('Word not found');

    const variantIds = word.variants.map((v) => v.id);
    const media = await this.prisma.mediaAsset.findMany({
      where: {
        OR: [
          { ownerType: 'word', ownerId: id },
          ...(variantIds.length
            ? [{ ownerType: 'word_variant' as const, ownerId: { in: variantIds } }]
            : []),
        ],
      },
      select: {
        id: true,
        ownerType: true,
        ownerId: true,
        type: true,
        publicUrl: true,
        mime: true,
        width: true,
        height: true,
        durationMs: true,
      },
    });

    // Resolve the handedness option image for this word's hand count (1/2) so the
    // detail view can show it as an image alongside the other attributes.
    const handedness = word.handCount
      ? await this.prisma.handedness.findFirst({
          where: { handCount: word.handCount },
          select: { id: true, code: true, label: true, imageUrl: true, handCount: true },
        })
      : null;

    return { ...word, handedness, media };
  }

  async variants(id: string): Promise<unknown> {
    const word = await this.prisma.word.findFirst({
      where: { id, status: 'approved', deletedAt: null },
      select: { id: true },
    });
    if (!word) throw new NotFoundException('Word not found');
    return this.prisma.wordVariant.findMany({
      where: { wordId: id },
      select: { id: true, label: true, description: true, region: true, isPrimary: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }
}
