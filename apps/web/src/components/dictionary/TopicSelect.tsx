'use client';

import { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@msl/ui';
import type { TopicNode } from '@/lib/dictionary/types';

export interface FlatTopic {
  id: string;
  name: string;
  number: string;
  depth: number;
  count: number;
}

export function flattenNumbered(nodes: TopicNode[], prefix: number[] = [], depth = 0): FlatTopic[] {
  return nodes.flatMap((n, i) => {
    const path = [...prefix, i + 1];
    const number = path.join('.') + (path.length === 1 ? '.' : '');
    return [
      { id: n.id, name: n.name, number, depth, count: n.wordCount },
      ...flattenNumbered(n.children ?? [], path, depth + 1),
    ];
  });
}

/** Indent depth via em-dash repetition — the only thing a native <option> can render. */
export function optionLabel(o: FlatTopic, showCounts: boolean): string {
  const indent = o.depth > 0 ? '—'.repeat(o.depth) + ' ' : '';
  const countSuffix = showCounts ? ` (${o.count})` : '';
  return `${indent}${o.number} ${o.name}${countSuffix}`;
}

const triggerCls =
  'h-control-sm w-full appearance-none rounded-md border border-border-strong bg-bg pl-3.5 pr-10 text-left text-base text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';

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
  const controlled = value !== undefined;
  const all = useMemo(() => flattenNumbered(topics), [topics]);
  // Drives the muted placeholder colour; uncontrolled reflects the initial value.
  const current = controlled ? value : defaultValue;

  return (
    <div className="group relative">
      <select
        name={name}
        required={required}
        aria-label={ariaLabel}
        // Either controlled (value) or uncontrolled (defaultValue) — never both,
        // so React doesn't warn and a native form reset restores defaultValue.
        {...(controlled ? { value } : { defaultValue })}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(triggerCls, !current && 'text-fg-subtle', className)}
      >
        <option value="" disabled={required}>
          {placeholder ?? '—'}
        </option>
        {all.map((o) => (
          <option key={o.id} value={o.id} className="text-fg">
            {optionLabel(o, showCounts)}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted transition-colors group-focus-within:text-primary"
      />
    </div>
  );
}
