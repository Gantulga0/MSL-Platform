import en from './messages/en.json';
import mn from './messages/mn.json';

export const LOCALES = ['mn', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale | undefined) ?? 'mn';

const MESSAGES: Record<Locale, Record<string, string>> = { mn, en };

export type MessageKey = keyof typeof mn;
export type TranslateParams = Record<string, string | number>;

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * Minimal i18n lookup. All user-facing strings MUST go through this so nothing
 * is hardcoded (NFR-10). Falls back to the default locale, then the key itself.
 * Supports `{name}` placeholder interpolation via `params`.
 */
export function translate(key: string, locale: Locale = DEFAULT_LOCALE, params?: TranslateParams): string {
  const template = MESSAGES[locale]?.[key] ?? MESSAGES[DEFAULT_LOCALE]?.[key] ?? key;
  return interpolate(template, params);
}

/** Convenience factory binding a locale, e.g. `const t = getTranslator('mn')`. */
export function getTranslator(
  locale: Locale = DEFAULT_LOCALE,
): (key: string, params?: TranslateParams) => string {
  return (key: string, params?: TranslateParams) => translate(key, locale, params);
}
