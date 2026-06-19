'use client';

import { useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { SlidersHorizontal } from 'lucide-react';
import { Button, Dialog, cn } from '@msl/ui';
import { translate as t } from '@/i18n';
import { TopicSelect } from '@/components/dictionary/TopicSelect';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';

interface Props {
  topics: TopicNode[];
  levels: TaxoRef[];
  ageGroups: TaxoRef[];
}

const FILTER_KEYS = ['q', 'topic', 'level', 'age', 'hands'] as const;

/**
 * Dictionary filters (FR-08, S-06). Sticky white card on desktop; an accessible
 * bottom-sheet drawer (Radix Dialog: focus-trap, Esc, scroll-lock) on mobile.
 * Search/topic/level/age plus the one/two-hand picker are all live URL filters
 * backed by the words API.
 */
export function FilterPanel({ topics, levels, ageGroups }: Props): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const activeCount = FILTER_KEYS.filter((k) => params.get(k)).length;

  function setParam(key: string, value: string): void {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    sp.delete('page');
    router.push(`${pathname}?${sp.toString()}` as Route);
  }

  function clearAll(): void {
    router.push(pathname as Route);
  }

  const sections = (
    <FilterSections
      topics={topics}
      levels={levels}
      ageGroups={ageGroups}
      params={params}
      setParam={setParam}
    />
  );

  return (
    <>
      {/* Mobile: trigger + bottom-sheet drawer */}
      <div className="lg:hidden">
        <Button variant="secondary" block aria-haspopup="dialog" onClick={() => setOpen(true)}>
          <SlidersHorizontal aria-hidden className="h-5 w-5" />
          {t('dict.filters')}
          {activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title={t('dict.filters')}
          closeLabel={t('dict.filtersClose')}
          className="bottom-0 left-0 top-auto max-h-[85dvh] w-full max-w-none -translate-x-0 -translate-y-0 overflow-y-auto rounded-2xl rounded-b-none"
          footer={
            activeCount > 0 ? (
              <Button
                variant="ghost"
                onClick={() => {
                  clearAll();
                  setOpen(false);
                }}
              >
                {t('dict.clearFilters')}
              </Button>
            ) : undefined
          }
        >
          {sections}
        </Dialog>
      </div>

      {/* Desktop: sticky sidebar */}
      <aside aria-label={t('dict.filters')} className="hidden lg:block">
        <div className="sticky top-6 max-h-[calc(100dvh-3rem)] space-y-6 overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-normal text-fg">{t('dict.filters')}</h2>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="rounded-full px-3 py-1 text-sm font-semibold text-accent-ink hover:bg-surface-muted"
              >
                {t('dict.clearFilters')}
              </button>
            )}
          </div>
          {sections}
        </div>
      </aside>
    </>
  );
}

function FilterSections({
  topics,
  levels,
  ageGroups,
  params,
  setParam,
}: Props & {
  params: ReadonlyURLSearchParams;
  setParam: (key: string, value: string) => void;
}): React.ReactElement {
  const selectCls =
    'h-control-sm w-full rounded-md border border-border-strong bg-surface px-3 text-base text-fg';
  const levelLabel = t('dict.filterLevel').replace(/:$/, '');
  const ageLabel = t('dict.filterAge').replace(/:$/, '');

  return (
    <div className="space-y-6">
      <Section title={t('dict.topics')}>
        <TopicSelect
          topics={topics}
          value={params.get('topic') ?? ''}
          onChange={(id) => setParam('topic', id)}
          ariaLabel={t('dict.topics')}
          placeholder={t('dict.allTopics')}
          className={selectCls}
          showCounts
        />
      </Section>

      <Section title={levelLabel}>
        <select
          className={selectCls}
          aria-label={levelLabel}
          value={params.get('level') ?? ''}
          onChange={(e) => setParam('level', e.target.value)}
        >
          <option value="">{t('dict.allLevels')}</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </Section>

      <Section title={ageLabel}>
        <select
          className={selectCls}
          aria-label={ageLabel}
          value={params.get('age') ?? ''}
          onChange={(e) => setParam('age', e.target.value)}
        >
          <option value="">{t('dict.allAges')}</option>
          {ageGroups.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </Section>

      <HandsToggle value={params.get('hands') ?? ''} setParam={setParam} />
    </div>
  );
}

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}): React.ReactElement {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-normal uppercase tracking-wide text-fg-muted">{title}</h3>
        {badge}
      </div>
      {children}
    </section>
  );
}

/** One-/two-hand filter — a live segmented URL filter (`hands`=1|2). */
function HandsToggle({
  value,
  setParam,
}: {
  value: string;
  setParam: (key: string, value: string) => void;
}): React.ReactElement {
  const opts: Array<[string, string]> = [
    ['', 'dict.handsAny'],
    ['1', 'dict.handsOne'],
    ['2', 'dict.handsTwo'],
  ];
  return (
    <Section title={t('dict.hands')}>
      <div role="group" aria-label={t('dict.hands')} className="inline-flex rounded-full bg-surface-muted p-1">
        {opts.map(([v, k]) => {
          const active = value === v;
          return (
            <button
              key={v || 'any'}
              type="button"
              aria-pressed={active}
              onClick={() => setParam('hands', v)}
              className={cn(
                'inline-flex min-h-touch items-center rounded-full px-4 text-sm font-medium',
                active ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
              )}
            >
              {t(k)}
            </button>
          );
        })}
      </div>
    </Section>
  );
}
