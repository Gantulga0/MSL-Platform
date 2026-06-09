export type DuplicateMethod = 'exact' | 'trigram';

export interface Candidate {
  wordId: string;
  lemma: string;
  method: DuplicateMethod;
  score: number;
}

export interface DuplicateDecision {
  isDuplicate: boolean;
  match?: Candidate;
}

export function decideDuplicate(candidates: Candidate[], threshold: number): DuplicateDecision {
  const exact = candidates.find((c) => c.method === 'exact');
  if (exact) return { isDuplicate: true, match: exact };

  const best = candidates
    .filter((c) => c.method === 'trigram')
    .sort((a, b) => b.score - a.score)[0];
  if (best && best.score >= threshold) return { isDuplicate: true, match: best };

  return { isDuplicate: false };
}
