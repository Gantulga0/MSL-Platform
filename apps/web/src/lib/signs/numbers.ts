export type NumberGroup = 'numbers' | 'expressions';

export const GROUP_LABELS: Record<NumberGroup, string> = {
  numbers: 'Тоо',
  expressions: 'Тооны нэр',
};

export interface NumberCategory {
  key: string;
  group: NumberGroup;
  label: string;
}

export interface NumberSign {
  category: string;
  label: string;
  src: string;
}

export const CATEGORIES: NumberCategory[] = [
  { key: '0-10', group: 'numbers', label: '0–10' },
  { key: '11-19', group: 'numbers', label: '11–19' },
  { key: '20-29', group: 'numbers', label: '20–29' },
  { key: '30-90', group: 'numbers', label: '30–90' },
  { key: '100-900', group: 'numbers', label: '100–900' },
  { key: '1000-10000', group: 'numbers', label: '1,000–10,000' },
  { key: '11000-19000', group: 'numbers', label: '11,000–19,000' },
  { key: '20000-90000', group: 'numbers', label: '20,000–90,000' },
  { key: '100000-1000000', group: 'numbers', label: '100,000–1,000,000' },
  { key: 'tsag', group: 'expressions', label: 'Цаг' },
  { key: 'tsagiin-tursh', group: 'expressions', label: 'Цагийн турш' },
  { key: 'ongorson-odruud', group: 'expressions', label: 'Өнгөрсөн өдрүүд' },
  { key: 'ireh-odruud', group: 'expressions', label: 'Ирэх өдрүүд' },
  { key: 'jil', group: 'expressions', label: 'Жил' },
  { key: 'des-dugaar', group: 'expressions', label: 'Дэс дугаар / дэс дараалал' },
  { key: 'davtamj', group: 'expressions', label: 'Давтамж /удаа/' },
  { key: 'bair-ezleh', group: 'expressions', label: 'Байр эзлэх' },
  { key: 'shirheg', group: 'expressions', label: 'Ширхэг' },
  { key: 'humuus-hamt', group: 'expressions', label: 'Хүмүүс хамт' },
  { key: 'hun-yavah', group: 'expressions', label: '"Хүн явах" дүрслэл' },
  { key: 'hun-ireh', group: 'expressions', label: '"Хүн ирэх" дүрслэл' },
  { key: 'minut', group: 'expressions', label: 'Минут' },
];

function withCommas(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function numberRange(category: string, start: number, end: number, step: number): NumberSign[] {
  const out: NumberSign[] = [];
  for (let n = start; n <= end; n += step) {
    out.push({ category, label: withCommas(n), src: `/signs/numbers/${n}.mp4` });
  }
  return out;
}

const ONES_WORDS = [
  'тэг',
  'нэг',
  'хоёр',
  'гурав',
  'дөрөв',
  'тав',
  'зургаа',
  'долоо',
  'найм',
  'ес',
  'арав',
];
const ONES: NumberSign[] = ONES_WORDS.map((word, n) => ({
  category: '0-10',
  label: `${n}. ${word}`,
  src: `/signs/numbers/${n}.mp4`,
}));

const EXPRESSION_PLACEHOLDERS: NumberSign[] = CATEGORIES.filter(
  (c) => c.group === 'expressions',
).map((c) => ({ category: c.key, label: c.label, src: `/signs/expressions/${c.key}.mp4` }));

export const SIGNS: NumberSign[] = [
  ...ONES,
  ...numberRange('11-19', 11, 19, 1),
  ...numberRange('20-29', 20, 29, 1),
  ...numberRange('30-90', 30, 90, 10),
  ...numberRange('100-900', 100, 900, 100),
  ...numberRange('1000-10000', 1000, 10000, 1000),
  ...numberRange('11000-19000', 11000, 19000, 1000),
  ...numberRange('20000-90000', 20000, 90000, 10000),
  ...numberRange('100000-1000000', 100000, 1000000, 100000),
  ...EXPRESSION_PLACEHOLDERS,
];
