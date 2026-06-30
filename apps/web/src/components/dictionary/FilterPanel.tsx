'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from 'next/navigation';
import type { Route } from 'next';
import { SignalHigh, SlidersHorizontal, Tags, Users, X } from 'lucide-react';
import { Button, Dialog, Select, cn, type SelectOption } from '@msl/ui';
import { useT } from '@/i18n/client';
import { flattenNumbered, optionLabel } from '@/components/dictionary/TopicSelect';
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
          <div className="relative z-[6] flex items-center justify-between gap-2 px-5 pb-4 pt-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal aria-hidden className="h-4 w-4 text-accent-ink" />
              <h2 className="font-display text-lg font-bold text-fg">{t('dict.filters')}</h2>
              {activeCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--amber)] px-1.5 text-xs font-bold tabular-nums text-[#3a2400]">
                  {activeCount}
                </span>
              )}
            </div>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold text-accent-ink transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <X aria-hidden className="h-3.5 w-3.5" />
                {t('dict.clearFilters')}
              </button>
            )}
          </div>
          <div className="relative z-[6] overflow-y-auto px-5 pb-5">{sections}</div>
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
  const levelLabel = t('dict.filterLevel').replace(/:$/, '');
  const ageLabel = t('dict.filterAge').replace(/:$/, '');

  const topicVal = params.get('topic') ?? '';
  const levelVal = params.get('level') ?? '';
  const ageVal = params.get('age') ?? '';

  // Flatten the topic tree into options once, encoding depth + counts in the label
  // (the styled dropdown shows them as plain text, like the level/age selects).
  const topicOptions = useMemo<SelectOption[]>(
    () => flattenNumbered(topics).map((o) => ({ value: o.id, label: optionLabel(o, true) })),
    [topics],
  );

  return (
    <div className="divide-y divide-border">
      <Section title={t('dict.topics')}>
        <FilterSelect
          ariaLabel={t('dict.topics')}
          value={topicVal}
          onChange={(v) => setParam('topic', v)}
          allLabel={t('dict.allTopics')}
          options={topicOptions}
          icon={<Tags aria-hidden />}
        />
      </Section>

      <Section title={levelLabel}>
        <FilterSelect
          ariaLabel={levelLabel}
          value={levelVal}
          onChange={(v) => setParam('level', v)}
          allLabel={t('dict.allLevels')}
          options={levels.map((l) => ({ value: l.id, label: l.label ?? l.name ?? l.code ?? l.id }))}
          icon={<SignalHigh aria-hidden />}
        />
      </Section>

      <Section title={ageLabel}>
        <FilterSelect
          ariaLabel={ageLabel}
          value={ageVal}
          onChange={(v) => setParam('age', v)}
          allLabel={t('dict.allAges')}
          options={ageGroups.map((a) => ({ value: a.id, label: a.label ?? a.name ?? a.code ?? a.id }))}
          icon={<Users aria-hidden />}
        />
      </Section>

      <HandsToggle value={params.get('hands') ?? ''} setParam={setParam} handedness={handedness} />
    </div>
  );
}

/** Shared control surface: a solid, legible field (not translucent) inside the glass panel. */
const FIELD_CLS =
  'h-control-md rounded-xl border-border-strong bg-surface font-medium transition-colors hover:border-fg-subtle';

/**
 * One filter dropdown: the brand-styled Radix Select with a leading icon and an
 * always-present "all" row that clears the filter. The control always shows a
 * concrete choice (the picked value, or "all …"), so there is no empty state to
 * style — and the active border signals when a real filter is applied.
 */
function FilterSelect({
  ariaLabel,
  value,
  onChange,
  allLabel,
  options,
  icon,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: SelectOption[];
  icon: ReactNode;
}): React.ReactElement {
  // Radix forbids an empty-string item value, so "all" uses a sentinel that maps
  // back to "" (cleared) on the way out.
  const ALL = '__all__';
  const allOptions = useMemo<SelectOption[]>(
    () => [{ value: ALL, label: allLabel }, ...options],
    [allLabel, options],
  );
  return (
    <Select
      ariaLabel={ariaLabel}
      value={value || ALL}
      onValueChange={(v) => onChange(v === ALL ? '' : v)}
      options={allOptions}
      leadingIcon={icon}
      className={cn(FIELD_CLS, value && 'border-primary')}
    />
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): React.ReactElement {
  return (
    <section className="space-y-2.5 py-4 first:pt-0 last:pb-0">
      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-fg-muted">{title}</h3>
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
        className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface-muted p-1"
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
                'inline-flex min-h-touch items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
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
