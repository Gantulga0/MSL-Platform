'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Search } from 'lucide-react';
import { translate as t } from '@/i18n';

/**
 * Dictionary search (S-07). Centered rounded pill with a leading icon and a
 * subtle ⌘K hint; ⌘K / Ctrl-K focuses it from anywhere. Submits to
 * /dictionary?q=… (server search). Fully keyboard-operable, labelled for SR.
 */
export function SearchBar({ initial = '' }: { initial?: string }): React.ReactElement {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <form
      role="search"
      className="relative mx-auto w-full max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        router.push((query ? `/dictionary?q=${encodeURIComponent(query)}` : '/dictionary') as Route);
      }}
    >
      <label htmlFor="dict-search" className="sr-only">
        {t('home.searchPlaceholder')}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-subtle"
      />
      <input
        ref={inputRef}
        id="dict-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('home.searchPlaceholder')}
        className="h-control-lg w-full rounded-full border border-border-strong bg-surface pl-12 pr-5 text-base text-fg shadow-sm placeholder:text-fg-subtle sm:pr-24"
      />
      <kbd
        aria-hidden
        className="absolute right-4 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded-md border border-border bg-surface-muted px-2 py-1 text-xs font-medium text-fg-muted sm:flex"
      >
        ⌘K
      </kbd>
      <button type="submit" className="sr-only">
        {t('common.search')}
      </button>
    </form>
  );
}
