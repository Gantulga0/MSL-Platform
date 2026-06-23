'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@msl/ui';
import { useT } from '@/i18n/client';

/**
 * Shared error-boundary UI. Rendered by the route-segment `error.tsx` files —
 * placing those inside the (public)/(admin) groups means this renders *within*
 * the AppShell (navbar + footer), so the user can recover or navigate away
 * instead of landing on a chrome-less page.
 */
export function ErrorScreen({
  error,
  reset,
}: {
  error?: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  const t = useT();
  useEffect(() => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [error]);

  return (
    <main
      id="main"
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center"
    >
      <h1 className="text-2xl font-bold text-fg">{t('error.title')}</h1>
      <p className="mt-2 text-fg-muted">{t('error.body')}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>{t('error.retry')}</Button>
        <Link href={'/' as Route} className="text-primary underline">
          {t('error.home')}
        </Link>
      </div>
    </main>
  );
}
