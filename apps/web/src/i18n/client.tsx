'use client';

import { createContext, useContext, useMemo } from 'react';
import { DEFAULT_LOCALE, translate, type Locale, type TranslateParams } from './index';

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/**
 * Provides the active locale (resolved server-side from the cookie) to client
 * components. Mounted once in the root layout. Server components read the locale
 * directly via `getLocale()` / `getServerT()` in `./server`.
 */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}): React.ReactElement {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** The active locale inside a client component. */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/**
 * Bound translator hook for client components: `const t = useT()` then `t('key')`.
 * The returned function is stable per-locale (memoized), so it's safe to list as
 * a hook dependency — it only changes when the locale changes, re-running any
 * memoized translations at that point.
 */
export function useT(): (key: string, params?: TranslateParams) => string {
  const locale = useContext(LocaleContext);
  return useMemo(() => (key: string, params?: TranslateParams) => translate(key, locale, params), [locale]);
}
