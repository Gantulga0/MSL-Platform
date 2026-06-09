import type { Topic } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { TaxonomyService, buildTopicTree, rollUpWordCounts } from './taxonomy.service';

function topic(id: string, parentId: string | null, name = id): Topic {
  return {
    id,
    parentId,
    name,
    slug: id,
    description: null,
    icon: null,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Topic;
}

describe('buildTopicTree', () => {
  it('nests children under their parent', () => {
    const tree = buildTopicTree([
      topic('science', null),
      topic('chemistry', 'science'),
      topic('physics', 'science'),
      topic('daily', null),
    ]);
    expect(tree.map((t) => t.id)).toEqual(['science', 'daily']);
    const science = tree.find((t) => t.id === 'science')!;
    expect(science.children.map((c) => c.id)).toEqual(['chemistry', 'physics']);
  });

  it('treats orphaned nodes (missing parent) as roots', () => {
    const tree = buildTopicTree([topic('orphan', 'gone')]);
    expect(tree.map((t) => t.id)).toEqual(['orphan']);
  });

  it('returns an empty array for no topics', () => {
    expect(buildTopicTree([])).toEqual([]);
  });
});

describe('rollUpWordCounts', () => {
  it("sets a parent's count to its own words plus the sum of its children", () => {
    const tree = buildTopicTree([
      topic('science', null),
      topic('chemistry', 'science'),
      topic('physics', 'science'),
    ]);
    rollUpWordCounts(
      tree,
      new Map([
        ['science', 3], // words attached directly to the parent
        ['chemistry', 10],
        ['physics', 7],
      ]),
    );
    const science = tree.find((t) => t.id === 'science')!;
    const childSum = science.children.reduce((s, c) => s + c.wordCount, 0);
    expect(childSum).toBe(17);
    expect(science.wordCount).toBe(3 + 17); // own + children
  });

  it('counts deep subtrees and defaults missing topics to zero', () => {
    const tree = buildTopicTree([
      topic('root', null),
      topic('mid', 'root'),
      topic('leaf', 'mid'),
    ]);
    rollUpWordCounts(tree, new Map([['leaf', 5]]));
    const root = tree.find((t) => t.id === 'root')!;
    const mid = root.children[0]!;
    expect(mid.children[0]!.wordCount).toBe(5);
    expect(mid.wordCount).toBe(5);
    expect(root.wordCount).toBe(5);
  });
});

describe('TaxonomyService.topicTree', () => {
  it('returns a nested tree where each parent count equals the sum of its children', async () => {
    const topics = [
      topic('conversational', null, 'Харилцан ярианд өргөн хэрэглэгддэг дохио'),
      topic('action-signs', 'conversational', 'Үйлдлийг илэрхийлсэн дохио'),
      topic('quality-signs', 'conversational', 'Шинж, чанар байдлыг илэрхийлсэн дохио'),
      topic('numbers', null, 'Тоо ба хурууны үсэг'),
    ];
    const prisma = {
      topic: { findMany: jest.fn().mockResolvedValue(topics) },
      word: {
        groupBy: jest.fn().mockResolvedValue([
          { topicId: 'conversational', _count: { _all: 2 } },
          { topicId: 'action-signs', _count: { _all: 257 } },
          { topicId: 'quality-signs', _count: { _all: 41 } },
          { topicId: 'numbers', _count: { _all: 18 } },
        ]),
      },
    } as unknown as PrismaService;

    const service = new TaxonomyService(prisma);
    const tree = await service.topicTree();

    // Only approved, non-deleted words are counted.
    expect(prisma.word.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'approved', deletedAt: null } }),
    );

    // Nested shape: two roots, the first with two children.
    expect(tree.map((t) => t.id)).toEqual(['conversational', 'numbers']);
    const conversational = tree.find((t) => t.id === 'conversational')!;
    expect(conversational.children.map((c) => c.id)).toEqual(['action-signs', 'quality-signs']);

    // Parent count == own words + sum of children.
    const childSum = conversational.children.reduce((s, c) => s + c.wordCount, 0);
    expect(childSum).toBe(257 + 41);
    expect(conversational.wordCount).toBe(2 + childSum);

    // A childless root just reflects its own count.
    expect(tree.find((t) => t.id === 'numbers')!.wordCount).toBe(18);
  });
});
