'use client';

import { useId, useRef, useState } from 'react';
import { cn } from '@msl/ui';
import { translate as t } from '@/i18n';
import type { WordVariant } from '@/lib/dictionary/types';

interface Attribute {
  id: string;
  label?: string | null;
  group: string;
  imageUrl?: string | null;
}

export interface WordDetailTabsProps {
  definition?: string | null;
  exampleSentence?: string | null;
  variants: WordVariant[];
  attributes: Attribute[];
}

/**
 * Pill-style tabs for the word-detail info panel (Variants / Definition / Usage).
 * Only tabs with content are shown. Accessible per the ARIA tabs pattern: a
 * labelled tablist, roving tabindex, ArrowLeft/Right + Home/End navigation, and
 * aria-selected/aria-controls wiring. Presentational only — all content comes
 * from the already-fetched word.
 */
export function WordDetailTabs({
  definition,
  exampleSentence,
  variants,
  attributes,
}: WordDetailTabsProps): React.ReactElement | null {
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const tabs = [
    variants.length > 0 && { key: 'var', label: t('dict.variants') },
    definition && { key: 'def', label: t('dict.definition') },
    exampleSentence && { key: 'use', label: t('dict.example') },
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const [active, setActive] = useState(0);
  if (tabs.length === 0) return null;

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    let next = active;
    if (e.key === 'ArrowRight') next = (active + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (active - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  const activeKey = tabs[active].key;

  return (
    <div className="mt-5">
      <div
        role="tablist"
        aria-label={t('dict.attributes')}
        onKeyDown={onKeyDown}
        className="flex w-fit gap-1 rounded-2xl bg-[var(--paper-2)] p-1.5"
      >
        {tabs.map((tab, i) => {
          const selected = i === active;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`${baseId}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                'min-h-touch rounded-xl px-4 text-sm font-bold transition-colors',
                selected
                  ? 'bg-surface text-fg shadow-[var(--shadow-sm)]'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${activeKey}`}
        aria-labelledby={`${baseId}-tab-${activeKey}`}
        className="pt-4 text-fg-muted"
        tabIndex={0}
      >
        {activeKey === 'var' && (
          <ul className="space-y-2.5">
            {variants.map((v) => (
              <li
                key={v.id}
                className="flex items-center gap-3.5 rounded-2xl border border-border bg-[var(--paper)] p-3.5"
              >
                <span className="h-12 w-12 flex-none rounded-xl bg-gradient-to-br from-[var(--sky)] to-[var(--ink)]" />
                <div className="min-w-0">
                  <b className="block font-semibold text-fg">{v.label}</b>
                  {v.description && <span className="text-sm">{v.description}</span>}
                  {v.region && <span className="block text-sm text-fg-subtle">{v.region}</span>}
                </div>
                {v.isPrimary && (
                  <span className="ml-auto flex-none rounded-lg bg-[color-mix(in_srgb,var(--jade)_16%,transparent)] px-2.5 py-1 text-xs font-extrabold text-[var(--jade)]">
                    {t('ds.variant')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {activeKey === 'def' && (
          <div className="space-y-4">
            {definition && <p className="text-fg">{definition}</p>}
            {attributes.length > 0 && (
              <ul className="flex flex-wrap gap-3">
                {attributes.map((a, i) => (
                  <li
                    key={`${a.id}-${i}`}
                    className="flex w-24 flex-col items-center gap-1 rounded-lg border border-border bg-surface p-2 text-center"
                  >
                    <span className="flex h-16 w-full items-center justify-center overflow-hidden rounded-md bg-surface-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.imageUrl ?? ''} alt={a.label ?? ''} className="h-full w-full object-contain" />
                    </span>
                    <span className="text-[11px] leading-tight text-fg-subtle">{a.group}</span>
                    <span className="text-xs font-medium leading-tight text-fg">{a.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeKey === 'use' && exampleSentence && (
          <div className="rounded-[0_14px_14px_0] border border-l-4 border-border border-l-[var(--amber)] bg-[var(--paper)] px-4 py-3.5 text-fg">
            {exampleSentence}
          </div>
        )}
      </div>
    </div>
  );
}
