export interface TaxoRef {
  id: string;
  code?: string;
  label?: string;
  name?: string;
  slug?: string;
}

export interface WordListItem {
  id: string;
  lemma: string;
  definition: string;
  exampleSentence: string | null;
  status: string;
  viewCount: number;
  topic: { id: string; name: string; slug: string } | null;
  level: { id: string; code: string; label: string } | null;
  ageGroup: { id: string; code: string; label: string } | null;
  location?: { id: string; code: string; label: string } | null;
  movement?: { id: string; code: string; label: string } | null;
}

export interface WordMedia {
  id: string;
  ownerType: 'word' | 'word_variant' | 'submission';
  ownerId: string;
  type: 'video' | 'image' | 'thumbnail';
  publicUrl: string | null;
  mime: string;
  width: number | null;
  height: number | null;
  durationMs: number | null;
}

export interface WordVariant {
  id: string;
  label: string;
  description: string | null;
  region: string | null;
  isPrimary: boolean;
}

export interface WordDetail extends WordListItem {
  source: string | null;
  createdAt: string;
  variants: WordVariant[];
  media: WordMedia[];
}

export interface TopicNode {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  /** Approved words in this topic plus its whole subtree (server-computed). */
  wordCount: number;
  children: TopicNode[];
}
