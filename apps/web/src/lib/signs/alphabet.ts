import { signAsset } from './cdn';

export interface AlphabetSign {
  letter: string;
  src: string;
  kind: 'image' | 'video';
}

export const ALPHABET_LETTERS = [
  'А',
  'Б',
  'В',
  'Г',
  'Д',
  'Е',
  'Ё',
  'Ж',
  'З',
  'И',
  'Й',
  'К',
  'Л',
  'М',
  'Н',
  'О',
  'Ө',
  'П',
  'Р',
  'С',
  'Т',
  'У',
  'Ү',
  'Ф',
  'Х',
  'Ц',
  'Ч',
  'Ш',
  'Щ',
  'Ъ',
  'Ы',
  'Ь',
  'Э',
  'Ю',
  'Я',
] as const;

// Alphabet hand-signs are still photos (one .jpg per Cyrillic letter, named by
// the uppercase letter, e.g. `/signs/alphabet/А.jpg`). Served from the public
// folder locally, or the signs CDN when NEXT_PUBLIC_SIGNS_BASE_URL is set.
export const ALPHABET: AlphabetSign[] = ALPHABET_LETTERS.map((letter) => ({
  letter,
  src: signAsset(`/signs/alphabet/${letter}.jpg`),
  kind: 'image',
}));
