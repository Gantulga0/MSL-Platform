import { parseDurationMs } from './tokens.service';

describe('parseDurationMs', () => {
  it.each([
    ['30s', 30_000],
    ['15m', 900_000],
    ['12h', 43_200_000],
    ['7d', 604_800_000],
    ['500ms', 500],
  ])('parses %s', (input, expected) => {
    expect(parseDurationMs(input)).toBe(expected);
  });

  it('accepts a bare millisecond number', () => {
    expect(parseDurationMs('1000')).toBe(1000);
  });

  it('throws on an unparseable value', () => {
    expect(() => parseDurationMs('soon')).toThrow();
  });
});
