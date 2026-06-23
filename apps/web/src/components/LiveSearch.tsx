'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { Search } from 'lucide-react';
import { cn } from '@msl/ui';
import { useT } from '@/i18n/client';
import type { SearchHit } from '@/app/api/search/route';

export function LiveSearch({ initial = '' }: { initial?: string }): React.ReactElement {
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

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

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setHits([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const handle = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
        .then((res) => res.json() as Promise<{ items: SearchHit[] }>)
        .then((data) => {
          setHits(data.items);
          setActive(-1);
          setOpen(true);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(handle);
      ctrl.abort();
    };
  }, [q]);

  // Close when clicking outside.
  useEffect(() => {
    function onDown(e: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function goToResults(): void {
    const query = q.trim();
    router.push((query ? `/dictionary?q=${encodeURIComponent(query)}` : '/dictionary') as Route);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open && hits.length) {
        setOpen(true);
        return;
      }
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      const hit = active >= 0 ? hits[active] : undefined;
      if (hit) {
        e.preventDefault();
        router.push(`/dictionary/${hit.id}` as Route);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showDropdown = open && q.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-2xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goToResults();
        }}
      >
        <label htmlFor="live-search" className="sr-only">
          {t('home.searchPlaceholder')}
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-subtle"
        />
        <input
          ref={inputRef}
          id="live-search"
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            if (hits.length) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={t('home.searchPlaceholder')}
          className="glass-field h-control-lg w-full rounded-full pl-12 pr-5 text-base text-fg placeholder:text-fg-subtle sm:pr-24"
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

      {/* Announce the result count to screen readers as matches arrive. */}
      <p className="sr-only" role="status" aria-live="polite">
        {hits.length > 0 ? t('search.resultsCount', { n: hits.length }) : ''}
      </p>

      {showDropdown && (
        <div className="glass glass-strong absolute z-20 mt-2 w-full overflow-hidden">
          {hits.length === 0 ? (
            <p className="relative z-[6] px-4 py-3 text-sm text-fg-muted" aria-live="polite">
              {loading ? t('common.loading') : t('dict.noResults')}
            </p>
          ) : (
            <>
              <ul role="listbox" id={listId} aria-label={t('search.resultsLabel')} className="relative z-[6] py-1">
                {hits.map((h, i) => (
                  <li
                    key={h.id}
                    id={`${listId}-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                  >
                    <Link
                      href={`/dictionary/${h.id}` as Route}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex min-h-touch items-center justify-between gap-3 px-4 py-2 text-left',
                        i === active ? 'bg-surface-muted' : 'hover:bg-surface-muted',
                      )}
                    >
                      <span className="font-medium text-fg">{h.lemma}</span>
                      {h.topic && <span className="truncate text-sm text-fg-muted">{h.topic}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={goToResults}
                className="relative z-[6] flex min-h-touch w-full items-center border-t border-border px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-surface-muted"
              >
                {t('search.viewAll')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
