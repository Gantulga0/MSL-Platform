import { getServerT } from '@/i18n/server';

/**
 * Fallback route-loading state for public pages that don't ship their own
 * loading.tsx (games, alphabet, numbers, rules, submit-word, profile). Renders
 * instantly on navigation so the transition never appears to hang while the
 * server renders the target page, and it gives next/link a boundary to prefetch.
 * (NFR-01: a screen-reader status + reduced-motion-safe pulse skeletons.)
 */
export default async function PublicLoading(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <p role="status" aria-live="polite" className="sr-only">
        {t('common.loading')}
      </p>
      <div aria-hidden className="space-y-8">
        <div className="space-y-3">
          <div className="h-9 w-64 max-w-full animate-pulse rounded-lg bg-surface-muted" />
          <div className="h-5 w-96 max-w-full animate-pulse rounded-md bg-surface-muted" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-[var(--r)] bg-surface-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}
