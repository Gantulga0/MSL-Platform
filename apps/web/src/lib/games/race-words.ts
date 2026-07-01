// Target words for the "Sign TypeRacer" games. The recognizer only knows the 35
// Cyrillic alphabet signs, so every word here is spelled with those letters —
// short, common, child-appropriate Mongolian words grouped by difficulty.
//
// There is no existing static word source in the repo (dictionary words live in
// the DB/API and aren't guaranteed to be alphabet-only), so this curated list is
// the offline source for both games. `wordPool` can additionally filter to the
// letters the loaded recognizer actually provides.

export type WordTier = 'easy' | 'medium' | 'hard';

export const TIERS: readonly WordTier[] = ['easy', 'medium', 'hard'] as const;

const WORDS: Record<WordTier, string[]> = {
  easy: ['ам', 'ус', 'нар', 'гар', 'мод', 'гэр', 'ном', 'сар', 'хот', 'нүд', 'зам', 'бал'],
  medium: ['морь', 'найз', 'багш', 'цэцэг', 'гэрэл', 'улаан', 'шувуу', 'дугуй', 'сарнай'],
  hard: ['сургууль', 'монгол', 'дэвтэр', 'сурагч', 'найрамдал', 'баярлалаа', 'хэрэгтэй'],
};

/** Split a word into its uppercase letters (the recognizer's template keys). */
export function lettersOf(word: string): string[] {
  return Array.from(word.toUpperCase());
}

/**
 * Words of a tier, optionally restricted to those whose every letter has a
 * loaded recognizer template (defensive — keeps a word from being unwinnable if
 * a sign is missing).
 */
export function wordPool(tier: WordTier, available?: Set<string>): string[] {
  const pool = WORDS[tier];
  if (!available || available.size === 0) return pool;
  return pool.filter((w) => lettersOf(w).every((l) => available.has(l)));
}

/** Pick a random word of a tier, avoiding an immediate repeat. */
export function pickWord(
  tier: WordTier,
  opts: { exclude?: string; available?: Set<string> } = {},
): string {
  const pool = wordPool(tier, opts.available);
  if (pool.length === 0) return WORDS[tier][0];
  if (pool.length === 1) return pool[0];
  let next = opts.exclude;
  while (next === opts.exclude) {
    next = pool[Math.floor(Math.random() * pool.length)];
  }
  return next!;
}
