import { SignCardSkeleton } from '@/components/dictionary/SignCard';
import { getServerT } from '@/i18n/server';

/** Route-level loading state for the dictionary (NFR-01: SR status + skeletons). */
export default async function DictionaryLoading(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <p role="status" aria-live="polite" className="sr-only">
        {t('common.loading')}
      </p>
      <div className="mb-6 space-y-2 sm:mb-8">
        <div aria-hidden className="h-8 w-48 animate-pulse rounded-md bg-surface-muted" />
        <div aria-hidden className="h-5 w-72 max-w-full animate-pulse rounded-md bg-surface-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:gap-8">
        {/* Filters skeleton (desktop only). */}
        <div aria-hidden className="hidden h-96 animate-pulse rounded-[var(--r)] bg-surface-muted lg:block" />
        {/* Results column. */}
        <div className="min-w-0">
          <div aria-hidden className="mb-5 h-14 w-full animate-pulse rounded-full bg-surface-muted" />
          <ul aria-hidden className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <li key={i}>
                <SignCardSkeleton />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
