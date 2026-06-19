export const CYRILLIC_LEMMA_PATTERN = /^[А-Яа-яЁёӨөҮү\s,-]+$/u;

export const CYRILLIC_LEMMA_MESSAGE =
  'Зөвхөн кирилл үсэг, зай, таслал, зураас оруулна уу (латин үсэг, тоо оруулах боломжгүй).';

export function isCyrillicLemma(value: string): boolean {
  return CYRILLIC_LEMMA_PATTERN.test(value);
}
