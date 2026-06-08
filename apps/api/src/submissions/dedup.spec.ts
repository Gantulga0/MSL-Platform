import { decideDuplicate, type Candidate } from './dedup';

const exact: Candidate = { wordId: 'w1', lemma: 'сайн уу', method: 'exact', score: 1 };
const near: Candidate = { wordId: 'w2', lemma: 'сайн', method: 'trigram', score: 0.6 };
const far: Candidate = { wordId: 'w3', lemma: 'сайхан', method: 'trigram', score: 0.2 };

describe('decideDuplicate (G-4)', () => {
  it('flags an exact match regardless of threshold', () => {
    expect(decideDuplicate([exact], 0.99).isDuplicate).toBe(true);
  });

  it('exact match wins over trigram candidates', () => {
    const d = decideDuplicate([near, exact], 0.45);
    expect(d.match?.method).toBe('exact');
  });

  it('flags a trigram candidate at/above the threshold', () => {
    const d = decideDuplicate([near], 0.45);
    expect(d.isDuplicate).toBe(true);
    expect(d.match?.wordId).toBe('w2');
  });

  it('does not flag trigram candidates below the threshold', () => {
    expect(decideDuplicate([far], 0.45).isDuplicate).toBe(false);
  });

  it('picks the highest-scoring trigram candidate', () => {
    const d = decideDuplicate([far, near], 0.45);
    expect(d.match?.wordId).toBe('w2');
  });

  it('returns not-duplicate for no candidates', () => {
    expect(decideDuplicate([], 0.45).isDuplicate).toBe(false);
  });
});
