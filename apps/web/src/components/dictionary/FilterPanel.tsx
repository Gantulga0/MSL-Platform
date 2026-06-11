'use client';

import { useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { SlidersHorizontal } from 'lucide-react';
import { Button, Dialog, cn } from '@msl/ui';
import { translate as t } from '@/i18n';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';
import { TopicTree } from './TopicTree';

interface Props {
  topics: TopicNode[];
  levels: TaxoRef[];
  ageGroups: TaxoRef[];
  locations: TaxoRef[];
  movements: TaxoRef[];
  handshapes: TaxoRef[];
}

const FILTER_KEYS = ['q', 'topic', 'level', 'age', 'location', 'movement', 'handshape', 'hands'] as const;

/** Flatten the topic tree into an indented, ordered list for a flat picker. */
function flattenTopics(nodes: TopicNode[], depth = 0): Array<{ id: string; label: string }> {
  const out: Array<{ id: string; label: string }> = [];
  for (const node of nodes) {
    out.push({ id: node.id, label: `${'— '.repeat(depth)}${node.name}` });
    if (node.children?.length) out.push(...flattenTopics(node.children, depth + 1));
  }
  return out;
}

/**
 * Dictionary filters (FR-08, S-06). Sticky white card on desktop; an accessible
 * bottom-sheet drawer (Radix Dialog: focus-trap, Esc, scroll-lock) on mobile.
 * Search/topic/level/age/location/movement plus the one/two-hand and handshape
 * pickers are all live URL filters backed by the words API.
 */
export function FilterPanel({
  topics,
  levels,
  ageGroups,
  locations,
  movements,
  handshapes,
}: Props): React.ReactElement {
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
      locations={locations}
      movements={movements}
      handshapes={handshapes}
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
            <h2 className="text-lg font-semibold text-fg">{t('dict.filters')}</h2>
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
  locations,
  movements,
  handshapes,
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
  const flatTopics = flattenTopics(topics);

  return (
    <div className="space-y-6">
      <Section title={t('dict.topics')}>
        <TopicTree topics={topics} activeId={params.get('topic') ?? undefined} />
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

      <Section title={t('dict.location')}>
        <select
          className={selectCls}
          aria-label={t('dict.location')}
          value={params.get('location') ?? ''}
          onChange={(e) => setParam('location', e.target.value)}
        >
          <option value="">{t('dict.allLocations')}</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </Section>

      <Section title={t('dict.movement')}>
        <select
          className={selectCls}
          aria-label={t('dict.movement')}
          value={params.get('movement') ?? ''}
          onChange={(e) => setParam('movement', e.target.value)}
        >
          <option value="">{t('dict.allMovements')}</option>
          {movements.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </Section>

      <Section title={t('dict.usefulTopics')}>
        <select
          className={selectCls}
          aria-label={t('dict.usefulTopics')}
          value={params.get('topic') ?? ''}
          onChange={(e) => setParam('topic', e.target.value)}
        >
          <option value="">{t('dict.allTopics')}</option>
          {flatTopics.map((tp) => (
            <option key={tp.id} value={tp.id}>
              {tp.label}
            </option>
          ))}
        </select>
      </Section>

      <HandsToggle value={params.get('hands') ?? ''} setParam={setParam} />

      <Section title={t('dict.handshape')}>
        <select
          className={selectCls}
          aria-label={t('dict.handshape')}
          value={params.get('handshape') ?? ''}
          onChange={(e) => setParam('handshape', e.target.value)}
        >
          <option value="">{t('dict.allHandshapes')}</option>
          {handshapes.map((h) => (
            <option key={h.id} value={h.id}>
              {h.label}
            </option>
          ))}
        </select>
      </Section>
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
        <h3 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">{title}</h3>
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
