'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@msl/ui';
import { useT } from '@/i18n/client';
import type { TopicNode } from '@/lib/dictionary/types';

interface FlatTopic {
  id: string;
  name: string;
  number: string;
  depth: number;
  count: number;
}

function flattenNumbered(nodes: TopicNode[], prefix: number[] = [], depth = 0): FlatTopic[] {
  return nodes.flatMap((n, i) => {
    const path = [...prefix, i + 1];
    const number = path.join('.') + (path.length === 1 ? '.' : '');
    return [
      { id: n.id, name: n.name, number, depth, count: n.wordCount },
      ...flattenNumbered(n.children ?? [], path, depth + 1),
    ];
  });
}

const triggerCls =
  'flex h-control-sm w-full items-center justify-between gap-2 rounded-md border border-border-strong bg-bg px-3 text-left text-base text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';

export function TopicSelect({
  name,
  topics,
  defaultValue = '',
  value,
  onChange,
  required = false,
  ariaLabel,
  placeholder,
  className,
  showCounts = false,
}: {
  name?: string;
  topics: TopicNode[];
  defaultValue?: string;
  value?: string;
  onChange?: (id: string) => void;
  required?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  showCounts?: boolean;
}): React.ReactElement {
  const t = useT();
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = controlled ? value : internal;

  const all = useMemo(() => flattenNumbered(topics), [topics]);
  const selected = all.find((o) => o.id === current);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const filtered = useMemo(
    () =>
      query.trim()
        ? all.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()))
        : all,
    [all, query],
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`${listId}-opt-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, listId]);

  useEffect(() => {
    if (controlled || !name) return;
    const form = rootRef.current?.closest('form');
    if (!form) return;
    const onReset = (): void => {
      setInternal(defaultValue);
      setQuery('');
    };
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, [controlled, name, defaultValue]);

  function choose(o: FlatTopic): void {
    if (!controlled) setInternal(o.id);
    onChange?.(o.id);
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

  const label = selected ? `${selected.number} ${selected.name}` : (placeholder ?? '—');
  const activeId = open && filtered[activeIndex] ? `${listId}-opt-${activeIndex}` : undefined;

  return (
    <div ref={rootRef} className="relative">
      {name && <input type="hidden" name={name} value={current} required={required} />}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={cn(triggerCls, className)}
      >
        <span className={cn('truncate', !selected && 'text-fg-subtle')}>{label}</span>
        <ChevronsUpDown aria-hidden className="h-4 w-4 shrink-0 text-fg-muted" />
      </button>

      {open && (
        <div className="glass glass-strong absolute z-40 mt-2 w-full overflow-hidden rounded-xl p-1.5 shadow-lg">
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
              aria-activedescendant={activeId}
              role="combobox"
              aria-expanded={open}
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
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={o.id === current}
                onClick={() => choose(o)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  'flex min-h-touch cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-base text-fg',
                  i === activeIndex && 'bg-surface-muted',
                )}
                style={{ paddingInlineStart: `${0.75 + o.depth}rem` }}
              >
                <span className="tabular-nums text-fg-subtle">{o.number}</span>
                <span className="flex-1 truncate" title={o.name}>
                  {o.name}
                </span>
                {showCounts && <span className="text-xs text-fg-subtle">{o.count}</span>}
                {o.id === current && (
                  <Check aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
