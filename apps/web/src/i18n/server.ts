import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALES, getTranslator, type Locale, type TranslateParams } from './index';
import { LOCALE_COOKIE } from './cookie';

/**
 * Resolve the active locale for the current request from the `msl-locale` cookie,
 * falling back to the default. Server-only (reads `next/headers`); client code
 * uses the LocaleProvider / `useT` from `./client` instead.
 */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

/** Bound translator for the current request's locale. `const t = await getServerT()`. */
export async function getServerT(): Promise<(key: string, params?: TranslateParams) => string> {
  return getTranslator(await getLocale());
}
