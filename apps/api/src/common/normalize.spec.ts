import { normalizeLemma } from './normalize';

describe('normalizeLemma', () => {
  it('lowercases and trims', () => {
    expect(normalizeLemma('  Сайн Уу  ')).toBe('сайн уу');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeLemma('гэр    бүл')).toBe('гэр бүл');
  });

  it('strips surrounding punctuation', () => {
    expect(normalizeLemma('"сайн!"')).toBe('сайн');
  });

  it('keeps internal letters/numbers intact', () => {
    expect(normalizeLemma('H2O')).toBe('h2o');
  });
});
