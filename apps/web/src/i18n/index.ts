import en from './messages/en.json';
import mn from './messages/mn.json';

export const LOCALES = ['mn', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale | undefined) ?? 'mn';

const MESSAGES: Record<Locale, Record<string, string>> = { mn, en };

export type MessageKey = keyof typeof mn;

/**
 * Minimal i18n lookup. All user-facing strings MUST go through this so nothing
 * is hardcoded (NFR-10). Falls back to the default locale, then the key itself.
 */
export function translate(key: string, locale: Locale = DEFAULT_LOCALE): string {
  return MESSAGES[locale]?.[key] ?? MESSAGES[DEFAULT_LOCALE]?.[key] ?? key;
}

/** Convenience factory binding a locale, e.g. `const t = getTranslator('mn')`. */
export function getTranslator(locale: Locale = DEFAULT_LOCALE): (key: string) => string {
  return (key: string) => translate(key, locale);
}
