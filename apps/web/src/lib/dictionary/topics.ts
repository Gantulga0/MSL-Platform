import type { TopicNode } from './types';

const NON_DICTIONARY_TOPIC_SLUGS = new Set(['numbers', 'alphabet', 'fingerspelling']);
const NON_DICTIONARY_TOPIC_NAMES = new Set(['Тоо ба хурууны үсэг']);

function isDictionaryTopic(t: TopicNode): boolean {
  return !NON_DICTIONARY_TOPIC_SLUGS.has(t.slug) && !NON_DICTIONARY_TOPIC_NAMES.has(t.name.trim());
}

export function dictionaryTopics(topics: TopicNode[]): TopicNode[] {
  return topics
    .filter(isDictionaryTopic)
    .map((t) => ({ ...t, children: dictionaryTopics(t.children) }));
}
