import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import type { Paginated } from '@msl/types';
import { Badge, Card, CardBody, EmptyState } from '@msl/ui';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';
import { SearchBar } from '@/components/dictionary/SearchBar';
import { FilterBar } from '@/components/dictionary/FilterBar';
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

  const showTiles = !sp.q && !sp.topic && !sp.level && !sp.age && (topics?.length ?? 0) > 0;
  const items = words?.data ?? [];

  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-fg">{translate('dict.title')}</h1>

      <div className="space-y-4">
        <SearchBar initial={sp.q ?? ''} />
        <FilterBar levels={levels ?? []} ageGroups={ageGroups ?? []} />
      </div>

      {showTiles && topics && (
        <section aria-labelledby="tiles-h" className="mt-8">
          <h2 id="tiles-h" className="mb-3 text-lg font-semibold text-fg">
            {translate('dict.browseByTopic')}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={`/dictionary?topic=${topic.id}` as Route}
                  className="flex min-h-touch items-center justify-center rounded-lg border border-border-strong bg-surface p-4 text-center font-medium text-fg hover:bg-surface-muted"
                >
                  {topic.icon ?? '📚'} {topic.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="results-h" className="mt-8">
        <h2 id="results-h" className="mb-3 text-lg font-semibold text-fg">
          {translate('dict.results')}
        </h2>
        {items.length === 0 ? (
          <EmptyState title={translate('dict.noResults')} description={translate('dict.noResultsHint')} />
        ) : (
          <>
            <ul className="grid gap-3 sm:grid-cols-2">
              {items.map((w) => (
                <li key={w.id}>
                  <Link href={`/dictionary/${w.id}` as Route} className="block">
                    <Card className="h-full transition-colors hover:bg-surface-muted">
                      <CardBody>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-lg font-semibold text-fg">{w.lemma}</h3>
                          {w.level && <Badge tone="info">{w.level.label}</Badge>}
                        </div>
                        <p className="mt-1 line-clamp-2 text-fg-muted">{w.definition}</p>
                        {w.topic && <p className="mt-2 text-sm text-fg-subtle">{w.topic.name}</p>}
                      </CardBody>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
            {words && words.meta.totalPages > 1 && (
              <div className="mt-6">
                <Pager page={words.meta.page} totalPages={words.meta.totalPages} />
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
