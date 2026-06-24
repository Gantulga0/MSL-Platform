import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { Search, Plus } from 'lucide-react';
import type { Paginated } from '@msl/types';
import { EmptyState } from '@msl/ui';
import { getServerT } from '@/i18n/server';
import { apiGetSafe, TAXONOMY_READ } from '@/lib/api/server';
import { LiveSearch } from '@/components/LiveSearch';
import { FilterPanel } from '@/components/dictionary/FilterPanel';
import { SignCard } from '@/components/dictionary/SignCard';
import { Pager } from '@/components/dictionary/Pager';
import { GestureScene } from '@/components/signs/GestureScene';
import type { TaxoRef, TopicNode, WordListItem } from '@/lib/dictionary/types';

export const metadata: Metadata = { title: 'Толь бичиг' };

/** A tidy 3×3 board — show the first nine signs; the pager carries the rest. */
const DISPLAY_LIMIT = 9;

interface SP {
  q?: string;
  topic?: string;
  level?: string;
  age?: string;
  hands?: string;
  page?: string;
}

/** Amber pill CTA — the brand's one action accent (matches the card play button). */
function amberCta(extra = ''): string {
  return `inline-flex min-h-touch items-center gap-2 rounded-full bg-[var(--amber)] px-5 font-bold text-[#3a2400] shadow-[0_8px_20px_-8px_var(--amber)] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none motion-reduce:hover:translate-y-0 ${extra}`;
}

/**
 * A muted "coming soon" tile that fills out a sparse grid so 1–2 real signs never
 * read as a broken board. Reuses the brand gesture-trail motif (no new effects);
 * purely decorative, so it is hidden from assistive tech.
 */
function PlaceholderTile({ label }: { label: string }): React.ReactElement {
  return (
    <li aria-hidden>
      <div className="glass flex h-full flex-col overflow-hidden opacity-70">
        <div className="sign-stage relative z-[6] aspect-[4/5]">
          <GestureScene className="absolute inset-0 h-full w-full" />
        </div>
        <div className="relative z-[6] px-4 pb-4 pt-3.5">
          <p className="truncate text-sm font-medium text-fg-subtle">{label}</p>
        </div>
      </div>
    </li>
  );
}

/** Invitation to contribute — a sparse/empty screen is a prompt to act, not a dead end. */
function ContributeCta({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: string;
}): React.ReactElement {
  return (
    <div className="glass mt-8 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative z-[6]">
        <p className="font-display text-lg font-bold text-fg">{title}</p>
        <p className="mt-1 text-fg-muted">{body}</p>
      </div>
      <Link href={'/submit-word' as Route} className={amberCta('relative z-[6] shrink-0')}>
        <Plus aria-hidden className="h-5 w-5" />
        {cta}
      </Link>
    </div>
  );
}

export default async function DictionaryPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<React.ReactElement> {
  const t = await getServerT();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1') || 1);

  const qs = new URLSearchParams();
  if (sp.q) qs.set('q', sp.q);
  if (sp.topic) qs.set('topic', sp.topic);
  if (sp.level) qs.set('level', sp.level);
  if (sp.age) qs.set('age', sp.age);
  if (sp.hands) qs.set('hands', sp.hands);
  qs.set('page', String(page));

  const [topics, levels, ageGroups, words] = await Promise.all([
    apiGetSafe<TopicNode[]>('/topics', TAXONOMY_READ),
    apiGetSafe<TaxoRef[]>('/levels', TAXONOMY_READ),
    apiGetSafe<TaxoRef[]>('/age-groups', TAXONOMY_READ),
    apiGetSafe<Paginated<WordListItem>>(`/words?${qs.toString()}`),
  ]);

  const meta = words?.meta;
  const total = meta?.total ?? 0;
  const items = (words?.data ?? []).slice(0, DISPLAY_LIMIT);
  const from = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const shownTo = from > 0 ? from + items.length - 1 : 0;

  const hasQuery = Boolean(sp.q || sp.topic || sp.level || sp.age || sp.hands);
  // Only pad while browsing (no active query); padding search results with
  // "coming soon" would misrepresent the matches.
  const padCount = hasQuery ? 0 : Math.max(0, DISPLAY_LIMIT - items.length);
  const showCta = total < DISPLAY_LIMIT;

  const countLabel =
    meta && meta.totalPages > 1
      ? t('dict.countRange', { total, from, to: shownTo })
      : t('dict.countTotal', { total });

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <header className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
          {t('dict.title')}
        </h1>
        <p className="mt-2 text-base text-fg-muted">{t('dict.subtitle')}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:gap-8">
        {/* Filters — left sticky sidebar (desktop) / bottom-sheet drawer (mobile). */}
        <FilterPanel topics={topics ?? []} levels={levels ?? []} ageGroups={ageGroups ?? []} />

        {/* Results column. */}
        <div className="min-w-0">
          {/* Toolbar: search fills the row; the count sits at its right. */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 sm:flex-1">
              <LiveSearch initial={sp.q ?? ''} className="w-full" />
            </div>
            {total > 0 && (
              <span className="glass-field inline-flex h-control-lg shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold text-fg">
                {countLabel}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title={sp.q ? t('dict.noResultsFor', { q: sp.q }) : t('dict.noResults')}
              description={t('dict.noResultsHint')}
              action={
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {hasQuery && (
                    <Link
                      href={'/dictionary' as Route}
                      className="inline-flex min-h-touch items-center rounded-full border border-border-strong px-5 font-semibold text-fg hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {t('dict.clearFilters')}
                    </Link>
                  )}
                  <Link href={'/submit-word' as Route} className={amberCta()}>
                    <Plus aria-hidden className="h-5 w-5" />
                    {t('nav.submitWord')}
                  </Link>
                </div>
              }
            />
          ) : (
            <>
              <ul
                aria-label={t('dict.gridLabel')}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {items.map((w, i) => (
                  <li key={w.id}>
                    <SignCard word={w} index={from + i} />
                  </li>
                ))}
                {Array.from({ length: padCount }).map((_, i) => (
                  <PlaceholderTile key={`pad-${i}`} label={t('dict.comingSoon')} />
                ))}
              </ul>

              {showCta && (
                <ContributeCta
                  title={t('dict.contributeTitle')}
                  body={t('dict.contributeBody')}
                  cta={t('nav.submitWord')}
                />
              )}

              {meta && meta.totalPages > 1 && (
                <div className="mt-8">
                  <Pager page={meta.page} totalPages={meta.totalPages} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
