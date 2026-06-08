import { translate, getTranslator, DEFAULT_LOCALE } from './index';

describe('i18n translate', () => {
  it('defaults to Mongolian', () => {
    expect(DEFAULT_LOCALE).toBe('mn');
  });

  it('returns the Mongolian string for a known key', () => {
    expect(translate('nav.dictionary', 'mn')).toBe('Толь бичиг');
  });

  it('returns the English string when locale is en', () => {
    expect(translate('nav.dictionary', 'en')).toBe('Dictionary');
  });

  it('falls back to the key for an unknown key', () => {
    expect(translate('nonexistent.key', 'mn')).toBe('nonexistent.key');
  });

  it('getTranslator binds a locale', () => {
    const t = getTranslator('en');
    expect(t('nav.games')).toBe('Games');
  });
});
