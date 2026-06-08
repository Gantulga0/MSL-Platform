/** Duplicate-detection primitives (G-4). The decision logic is pure → unit-tested. */

export type DuplicateMethod = 'exact' | 'trigram';

export interface Candidate {
  wordId: string;
  lemma: string;
  method: DuplicateMethod;
  /** 1.0 for exact; pg_trgm similarity (0..1) for trigram. */
  score: number;
}

export interface DuplicateDecision {
  isDuplicate: boolean;
  match?: Candidate;
}

/**
 * Decide whether a set of candidate matches constitutes a duplicate. An exact
 * normalized-lemma match always wins; otherwise the best trigram candidate must
 * meet the configurable similarity threshold (G-4, S-34).
 */
export function decideDuplicate(candidates: Candidate[], threshold: number): DuplicateDecision {
  const exact = candidates.find((c) => c.method === 'exact');
  if (exact) return { isDuplicate: true, match: exact };

  const best = candidates
    .filter((c) => c.method === 'trigram')
    .sort((a, b) => b.score - a.score)[0];
  if (best && best.score >= threshold) return { isDuplicate: true, match: best };

  return { isDuplicate: false };
}
