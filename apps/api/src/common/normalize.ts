/**
 * Canonical lemma normalization used by dictionary search and duplicate
 * detection (G-4). Lowercase, trim, collapse internal whitespace, and strip
 * surrounding punctuation. Mongolian Cyrillic lowercases correctly via toLowerCase.
 */
export function normalizeLemma(input: string): string {
  return input
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}
