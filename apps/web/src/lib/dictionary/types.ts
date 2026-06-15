export interface TaxoRef {
  id: string;
  code?: string;
  label?: string;
  name?: string;
  slug?: string;
  imageUrl?: string | null;
  /** Present on handedness options — maps to Word.handCount (1 or 2). */
  handCount?: number;
}

export interface OptionRef {
  id: string;
  code: string;
  label: string;
  imageUrl?: string | null;
}

export interface WordListItem {
  id: string;
  lemma: string;
  definition: string | null;
  exampleSentence: string | null;
  status: string;
  topic: {
    id: string;
    name: string;
    slug: string;
    parent?: { id: string; name: string; slug: string } | null;
  } | null;
  level: { id: string; code: string; label: string } | null;
  ageGroup: { id: string; code: string; label: string } | null;
  handCount?: number | null;
  /** The word's sign video, for hover-to-play on the card. */
  video?: { url: string } | null;
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
  handedness?: OptionRef | null;
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
