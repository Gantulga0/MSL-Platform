import { getServerT } from '@/i18n/server';

/**
 * Route-level loading state for a word detail page: a back-link, the player frame
 * and the text column as skeletons. Shows instantly on navigation so opening a
 * sign never appears to hang while the detail (and its video metadata) loads.
 * (NFR-01: SR status + reduced-motion-safe pulse.)
 */
export default async function WordDetailLoading(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p role="status" aria-live="polite" className="sr-only">
        {t('common.loading')}
      </p>
      <div aria-hidden className="mb-4 h-9 w-28 animate-pulse rounded-full bg-surface-muted" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-[4/5] w-full animate-pulse rounded-[var(--r)] bg-surface-muted" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-surface-muted" />
          <div className="h-5 w-1/2 animate-pulse rounded-md bg-surface-muted" />
          <div className="h-32 w-full animate-pulse rounded-[var(--r)] bg-surface-muted" />
          <div className="h-24 w-full animate-pulse rounded-[var(--r)] bg-surface-muted" />
        </div>
      </div>
    </main>
  );
}
