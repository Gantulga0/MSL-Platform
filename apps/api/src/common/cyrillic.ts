export const CYRILLIC_LEMMA_PATTERN = /^[А-Яа-яЁёӨөҮү\s-]+$/u;

export const CYRILLIC_LEMMA_MESSAGE =
  'Зөвхөн кирилл үсгээр бичнэ үү (латин үсэг, тоо, тусгай тэмдэгт оруулах боломжгүй).';

export function isCyrillicLemma(value: string): boolean {
  return CYRILLIC_LEMMA_PATTERN.test(value);
}
