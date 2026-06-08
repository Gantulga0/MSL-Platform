'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { translate as t } from '@/i18n';
import type { TaxoRef } from '@/lib/dictionary/types';

/** Level + age-group filters (FR-08). Navigates with updated query, resets page. */
export function FilterBar({
  levels,
  ageGroups,
}: {
  levels: TaxoRef[];
  ageGroups: TaxoRef[];
}): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value: string): void {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    sp.delete('page');
    router.push(`${pathname}?${sp.toString()}` as Route);
  }

  const selectCls =
    'h-control-sm rounded-md border border-border-strong bg-bg px-3 text-base text-fg';

  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex items-center gap-2 text-sm text-fg-muted">
        {t('dict.filterLevel')}
        <select
          className={selectCls}
          defaultValue={params.get('level') ?? ''}
          onChange={(e) => setParam('level', e.target.value)}
        >
          <option value="">{t('dict.allLevels')}</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-fg-muted">
        {t('dict.filterAge')}
        <select
          className={selectCls}
          defaultValue={params.get('age') ?? ''}
          onChange={(e) => setParam('age', e.target.value)}
        >
          <option value="">{t('dict.allAges')}</option>
          {ageGroups.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
