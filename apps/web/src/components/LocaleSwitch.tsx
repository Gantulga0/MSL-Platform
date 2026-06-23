'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { type Locale } from '@/i18n';
import { useLocale, useT } from '@/i18n/client';
import { LOCALE_COOKIE } from '@/i18n/cookie';

/**
 * Glass language switch in the nav, sibling of ThemeToggle. Persists the choice
 * in the `msl-locale` cookie (read server-side by getLocale) and refreshes the
 * route so server components re-render in the new locale. Accessible: a real
 * <button> with a state-aware label; shows the language it will switch TO.
 */
export function LocaleSwitch(): React.ReactElement {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();

  const next: Locale = locale === 'mn' ? 'en' : 'mn';

  function switchTo(): void {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={switchTo}
      disabled={pending}
      aria-label={t('locale.switch')}
      title={t('locale.switch')}
      className="glass glass-sm inline-flex min-h-touch min-w-touch items-center justify-center rounded-full px-3 text-sm font-semibold text-fg transition-transform hover:-translate-y-0.5 disabled:opacity-60 motion-reduce:transform-none"
    >
      {locale === 'mn' ? 'EN' : 'МН'}
    </button>
  );
}
