'use client';

import { useMemo, useState } from 'react';
import { cn } from '@msl/ui';
import { useT } from '@/i18n/client';
import { SignBoard } from './SignBoard';
import type { SignItem } from './types';
import {
  GROUP_LABELS,
  type NumberCategory,
  type NumberGroup,
  type NumberSign,
} from '@/lib/signs/numbers';

const GROUP_ORDER: NumberGroup[] = ['numbers', 'expressions'];

export function NumbersExplorer({
  categories,
  signs,
}: {
  categories: NumberCategory[];
  signs: NumberSign[];
}): React.ReactElement {
  const t = useT();
  const [active, setActive] = useState<string>(categories[0]?.key ?? '');
  const activeCat = categories.find((c) => c.key === active) ?? categories[0];

  const items: SignItem[] = useMemo(
    () =>
      signs
        .filter((s) => s.category === active)
        .map((s, i) => ({
          key: `${s.category}-${i}`,
          display: s.label,
          src: s.src,
          ariaLabel: t('signs.signOfLabel', { label: s.label }),
          dialogLabel: t('signs.signOfLabel', { label: s.label }),
        })),
    [signs, active, t],
  );

  const heading = activeCat ? `${GROUP_LABELS[activeCat.group]}: ${activeCat.label}` : '';

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <aside className="mb-6 lg:mb-0 lg:w-64 lg:shrink-0">
        <nav aria-label={t('numbers.filterNav')} className="space-y-5">
          {GROUP_ORDER.map((group) => {
            const cats = categories.filter((c) => c.group === group);
            if (cats.length === 0) return null;
            return (
              <div key={group}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
                  {GROUP_LABELS[group]}
                </h2>
                <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
                  {cats.map((cat) => {
                    const isActive = cat.key === active;
                    return (
                      <li key={cat.key} className="lg:w-full">
                        <button
                          type="button"
                          onClick={() => setActive(cat.key)}
                          aria-pressed={isActive}
                          className={cn(
                            'inline-flex min-h-touch shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm transition-colors lg:w-full lg:justify-start lg:rounded-lg',
                            isActive
                              ? 'border-primary bg-primary font-semibold text-fg-on-primary'
                              : 'border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg',
                          )}
                        >
                          {cat.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <h1
          aria-live="polite"
          className="mb-6 text-2xl font-bold tracking-tight text-fg sm:text-3xl"
        >
          {heading}
        </h1>
        {items.length > 0 ? (
          <SignBoard
            items={items}
            gridLabel={heading}
            closeLabel={t('common.close')}
            gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            tileSize="sm"
          />
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-surface p-8 text-center text-fg-muted">
            {t('signs.emptyCategory')}
          </p>
        )}
      </div>
    </div>
  );
}
