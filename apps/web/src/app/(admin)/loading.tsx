import { getServerT } from '@/i18n/server';

/**
 * Fallback route-loading state for the admin area so navigating between the
 * dashboard, review queue, words and settings shows instant feedback instead of
 * appearing to hang while the page renders. (NFR-01: SR status + pulse skeleton.)
 */
export default async function AdminLoading(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <p role="status" aria-live="polite" className="sr-only">
        {t('common.loading')}
      </p>
      <div aria-hidden className="space-y-6">
        <div className="h-9 w-56 max-w-full animate-pulse rounded-lg bg-surface-muted" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 w-full animate-pulse rounded-xl bg-surface-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
