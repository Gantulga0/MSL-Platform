'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Search } from 'lucide-react';
import { Button } from '@msl/ui';
import { translate as t } from '@/i18n';

/** Dictionary search box (S-07). Submits to /dictionary?q=... (server search). */
export function SearchBar({ initial = '' }: { initial?: string }): React.ReactElement {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  return (
    <form
      role="search"
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        router.push((query ? `/dictionary?q=${encodeURIComponent(query)}` : '/dictionary') as Route);
      }}
    >
      <label htmlFor="dict-search" className="sr-only">
        {t('home.searchPlaceholder')}
      </label>
      <input
        id="dict-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('home.searchPlaceholder')}
        className="h-control-md w-full rounded-md border border-border-strong bg-bg px-3 text-base text-fg"
      />
      <Button type="submit">
        <Search aria-hidden className="h-5 w-5" />
        {t('common.search')}
      </Button>
    </form>
  );
}
