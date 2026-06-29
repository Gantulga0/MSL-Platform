/**
 * The name shown for a word: its lemma plus any synonym labels (same sign,
 * alternate wording) joined by ", " — e.g. "дуудах, нааш ир, хүрээд ир".
 * Labels equal to the lemma are dropped so it never repeats itself.
 */
export function wordDisplayName(
  lemma: string,
  variants?: { label: string }[] | null,
): string {
  const extras = (variants ?? [])
    .map((v) => v.label.trim())
    .filter((label) => label && label.toLowerCase() !== lemma.toLowerCase());
  return extras.length ? `${lemma}, ${extras.join(', ')}` : lemma;
}
