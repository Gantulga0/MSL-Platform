'use client';

import type { TopicNode } from '@/lib/dictionary/types';

/** Non-breaking spaces — regular leading spaces get trimmed inside <option>. */
const INDENT = '   ';

/**
 * Flatten a subtree into numbered, indented options ("1.", "1.1", "1.2"…) so a
 * plain <select> reads as a hierarchy. Every node (parent or child, with or
 * without children) is selectable. With `showCounts` each label gets the
 * topic's approved-word count "(N)".
 */
function flattenNumbered(
  nodes: TopicNode[],
  showCounts: boolean,
  prefix: number[] = [],
): { id: string; label: string }[] {
  return nodes.flatMap((n, i) => {
    const path = [...prefix, i + 1];
    const num = path.join('.') + (path.length === 1 ? '.' : '');
    const indent = INDENT.repeat(path.length - 1);
    const count = showCounts ? ` (${n.wordCount})` : '';
    return [
      { id: n.id, label: `${indent}${num} ${n.name}${count}` },
      ...flattenNumbered(n.children, showCounts, path),
    ];
  });
}

const selectCls = 'h-control-sm w-full rounded-md border border-border-strong bg-bg px-3 text-base text-fg';

/**
 * Hierarchical topic picker backed by a native <select> (FormData-friendly,
 * keyboard-accessible by default — NFR-01). Every topic — parent or child —
 * renders as a single selectable <option>, numbered ("1.", "1.1", "1.2"…) and
 * indented by depth so the flat list still reads as a tree. With `showCounts`,
 * each topic shows its approved-word count "(N)".
 *
 * Uncontrolled by default; pass `value` + `onChange` for controlled use.
 * Shared across the dictionary filters, submission form, and admin/review tools.
 */
export function TopicSelect({
  name,
  topics,
  defaultValue = '',
  value,
  onChange,
  required = false,
  ariaLabel,
  placeholder,
  className = selectCls,
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
  return (
    <select
      name={name}
      aria-label={ariaLabel}
      required={required}
      {...(controlled ? { value, onChange: (e) => onChange?.(e.target.value) } : { defaultValue })}
      className={className}
    >
      <option value="" disabled={required}>
        {placeholder ?? '—'}
      </option>
      {flattenNumbered(topics, showCounts).map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
