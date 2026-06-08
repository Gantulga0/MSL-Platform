import type { Topic } from '@prisma/client';
import { buildTopicTree } from './taxonomy.service';

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
