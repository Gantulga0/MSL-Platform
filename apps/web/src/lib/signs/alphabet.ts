import { signAsset } from './cdn';

export interface AlphabetSign {
  letter: string;
  src: string;
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

export const ALPHABET: AlphabetSign[] = ALPHABET_LETTERS.map((letter) => ({
  letter,
  src: signAsset(`/signs/alphabet/${letter.toLowerCase()}.mp4`),
}));
