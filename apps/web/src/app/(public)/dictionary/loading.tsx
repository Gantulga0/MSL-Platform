import { SignCardSkeleton } from '@/components/dictionary/SignCard';
import { getServerT } from '@/i18n/server';

/** Route-level loading state for the dictionary (NFR-01: SR status + skeletons). */
export default async function DictionaryLoading(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <p role="status" aria-live="polite" className="sr-only">
        {t('common.loading')}
      </p>
      <div className="mb-8 flex flex-col items-center gap-4">
        <div aria-hidden className="h-8 w-48 animate-pulse rounded-md bg-surface-muted" />
        <div aria-hidden className="h-14 w-full max-w-2xl animate-pulse rounded-full bg-surface-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <ul aria-hidden className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <SignCardSkeleton />
            </li>
          ))}
        </ul>
        <div aria-hidden className="hidden h-96 animate-pulse rounded-2xl bg-surface-muted lg:block" />
      </div>
    </main>
  );
}
