'use client';

import { useState, type ReactNode } from 'react';
import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from 'next/navigation';
import type { Route } from 'next';
import { SlidersHorizontal } from 'lucide-react';
import { Button, Dialog, cn } from '@msl/ui';
import { useT } from '@/i18n/client';
import { TopicSelect } from '@/components/dictionary/TopicSelect';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';

interface Props {
  topics: TopicNode[];
  levels: TaxoRef[];
  ageGroups: TaxoRef[];
  handedness: TaxoRef[];
}

const FILTER_KEYS = ['q', 'topic', 'level', 'age', 'hands'] as const;

export function FilterPanel({ topics, levels, ageGroups, handedness }: Props): React.ReactElement {
  const t = useT();
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
      handedness={handedness}
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

      <aside aria-label={t('dict.filters')} className="hidden lg:block">
        <div className="glass sticky top-24 flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden">
          <div className="relative z-[6] flex items-center justify-between gap-2 px-5 pt-5">
            <h2 className="font-display text-lg font-bold text-fg">{t('dict.filters')}</h2>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="rounded-full px-3 py-1 text-sm font-semibold text-accent-ink hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t('dict.clearFilters')}
              </button>
            )}
          </div>
          <div className="relative z-[6] overflow-y-auto px-5 pb-5 pt-5">{sections}</div>
        </div>
      </aside>
    </>
  );
}

function FilterSections({
  topics,
  levels,
  ageGroups,
  handedness,
  params,
  setParam,
}: Props & {
  params: ReadonlyURLSearchParams;
  setParam: (key: string, value: string) => void;
}): React.ReactElement {
  const t = useT();
  const selectCls =
    'h-control-md w-full rounded-md border border-border-strong bg-surface px-3 text-base text-fg';
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

      <HandsToggle value={params.get('hands') ?? ''} setParam={setParam} handedness={handedness} />
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

function HandsToggle({
  value,
  setParam,
  handedness,
}: {
  value: string;
  setParam: (key: string, value: string) => void;
  handedness: TaxoRef[];
}): React.ReactElement {
  const t = useT();
  const imgFor = (hc: number): string | null =>
    handedness.find((h) => h.handCount === hc)?.imageUrl ?? null;
  const opts: Array<{ v: string; label: string; img: string | null }> = [
    { v: '', label: t('dict.handsAny'), img: null },
    { v: '1', label: t('dict.handsOne'), img: imgFor(1) },
    { v: '2', label: t('dict.handsTwo'), img: imgFor(2) },
  ];
  return (
    <Section title={t('dict.hands')}>
      <div
        role="group"
        aria-label={t('dict.hands')}
        className="inline-flex rounded-full bg-surface-muted p-1"
      >
        {opts.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v || 'any'}
              type="button"
              aria-pressed={active}
              onClick={() => setParam('hands', o.v)}
              className={cn(
                'inline-flex min-h-touch items-center gap-1.5 rounded-full px-3 text-sm font-medium',
                active ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
              )}
            >
              {o.img && (
                /* Hand-count sign image from R2; label carries the meaning (a11y). */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={o.img} alt="" aria-hidden className="h-5 w-5 object-contain" />
              )}
              {o.label}
            </button>
          );
        })}
      </div>
    </Section>
  );
}
