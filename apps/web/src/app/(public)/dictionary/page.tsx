import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import type { Paginated } from '@msl/types';
import { EmptyState } from '@msl/ui';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';
import { SearchBar } from '@/components/dictionary/SearchBar';
import { FilterPanel } from '@/components/dictionary/FilterPanel';
import { SignCard } from '@/components/dictionary/SignCard';
import { Pager } from '@/components/dictionary/Pager';
import type { TaxoRef, TopicNode, WordListItem } from '@/lib/dictionary/types';

export const metadata: Metadata = { title: 'Толь бичиг' };

interface SP {
  q?: string;
  topic?: string;
  level?: string;
  age?: string;
  page?: string;
}

export default async function DictionaryPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<React.ReactElement> {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1') || 1);

  const qs = new URLSearchParams();
  if (sp.q) qs.set('q', sp.q);
  if (sp.topic) qs.set('topic', sp.topic);
  if (sp.level) qs.set('level', sp.level);
  if (sp.age) qs.set('age', sp.age);
  qs.set('page', String(page));

  const [topics, levels, ageGroups, words] = await Promise.all([
    apiGetSafe<TopicNode[]>('/topics'),
    apiGetSafe<TaxoRef[]>('/levels'),
    apiGetSafe<TaxoRef[]>('/age-groups'),
    apiGetSafe<Paginated<WordListItem>>(`/words?${qs.toString()}`),
  ]);

  const items = words?.data ?? [];
  const meta = words?.meta;
  const from = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const to = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {translate('dict.title')}
        </h1>
        {meta && meta.total > 0 && (
          <p className="mt-2 text-base text-fg-muted">
            {translate('dict.resultCount', undefined, { total: meta.total, from, to })}
          </p>
        )}
        <div className="mt-6">
          <SearchBar initial={sp.q ?? ''} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Results */}
        <div className="order-2 lg:order-1">
          {items.length === 0 ? (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title={translate('dict.noResults')}
              description={translate('dict.noResultsHint')}
            />
          ) : (
            <>
              <ul
                aria-label={translate('dict.gridLabel')}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
              >
                {items.map((w, i) => (
                  <li key={w.id}>
                    <SignCard word={w} index={from + i} />
                  </li>
                ))}
              </ul>
              {meta && meta.totalPages > 1 && (
                <div className="mt-8">
                  <Pager page={meta.page} totalPages={meta.totalPages} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Filters */}
        <div className="order-1 lg:order-2">
          <FilterPanel topics={topics ?? []} levels={levels ?? []} ageGroups={ageGroups ?? []} />
        </div>
      </div>
    </main>
  );
}
