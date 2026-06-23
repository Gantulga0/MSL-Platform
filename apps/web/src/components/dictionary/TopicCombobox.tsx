'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@msl/ui';
import { translate as t } from '@/i18n';
import type { TopicNode } from '@/lib/dictionary/types';

interface FlatTopic {
  id: string;
  name: string;
  depth: number;
  count: number;
}

function flatten(nodes: TopicNode[], depth = 0): FlatTopic[] {
  return nodes.flatMap((n) => [
    { id: n.id, name: n.name, depth, count: n.wordCount },
    ...flatten(n.children ?? [], depth + 1),
  ]);
}

/**
 * Searchable, keyboard-accessible topic picker (combobox/listbox pattern) for the
 * deep, 800–1000-word taxonomy where a native <select> can't be scanned. Filters
 * by name as you type, shows the approved-word count per topic, and indents by
 * depth. A hidden input keeps it FormData-friendly. Keyboard: ↑/↓ move, Enter
 * selects, Esc closes. Honours reduced-motion (NFR-01).
 */
export function TopicCombobox({
  name,
  topics,
  value,
  onChange,
  required,
  placeholder,
  ariaLabel,
}: {
  name?: string;
  topics: TopicNode[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}): React.ReactElement {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const all = useMemo(() => flatten(topics), [topics]);
  const filtered = useMemo(
    () =>
      query.trim()
        ? all.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()))
        : all,
    [all, query],
  );
  const selected = all.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  function choose(o: FlatTopic): void {
    onChange(o.id);
    setOpen(false);
    setQuery('');
  }

  function onKeyDown(e: React.KeyboardEvent): void {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const o = filtered[activeIndex];
      if (o) choose(o);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {name && <input type="hidden" name={name} value={value} required={required} />}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className="flex h-control-sm w-full items-center justify-between gap-2 rounded-md border border-border-strong bg-bg px-3 text-left text-base text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className={cn('truncate', !selected && 'text-fg-subtle')}>
          {selected ? selected.name : placeholder ?? '—'}
        </span>
        <ChevronsUpDown aria-hidden className="h-4 w-4 shrink-0 text-fg-muted" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="glass glass-strong absolute z-40 mt-2 w-full overflow-hidden rounded-xl p-1.5"
          >
            <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-2.5">
              <Search aria-hidden className="h-4 w-4 text-fg-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={t('common.search')}
                aria-label={t('common.search')}
                aria-controls={listId}
                className="h-10 w-full bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
              />
            </div>
            <ul id={listId} role="listbox" className="mt-1.5 max-h-72 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-fg-muted">{t('dict.noResults')}</li>
              )}
              {filtered.map((o, i) => (
                <li
                  key={o.id}
                  role="option"
                  aria-selected={o.id === value}
                  onClick={() => choose(o)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'flex min-h-touch cursor-pointer items-center gap-2 rounded-lg px-3 text-base text-fg',
                    i === activeIndex && 'bg-surface-muted',
                  )}
                  style={{ paddingInlineStart: `${0.75 + o.depth}rem` }}
                >
                  <span className="flex-1 truncate">{o.name}</span>
                  <span className="text-xs text-fg-subtle">{o.count}</span>
                  {o.id === value && <Check aria-hidden className="h-4 w-4 text-primary" />}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
