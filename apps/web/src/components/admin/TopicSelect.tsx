'use client';

import type { TopicNode } from '@/lib/dictionary/types';

/**
 * Flatten the topic tree into numbered, indented options ("1.", "1.1", "1.2",
 * "2."…) so a plain <select> reads as a parent → child hierarchy. Any node
 * (parent or child) is selectable; picking a child still belongs to its parent
 * (the server resolves the parent for display).
 */
function flattenNumbered(
  nodes: TopicNode[],
  prefix: number[] = [],
): { id: string; label: string }[] {
  return nodes.flatMap((n, i) => {
    const path = [...prefix, i + 1];
    const num = path.join('.') + (path.length === 1 ? '.' : '');
    const indent = '  '.repeat(path.length - 1);
    return [
      { id: n.id, label: `${indent}${num} ${n.name}` },
      ...flattenNumbered(n.children, path),
    ];
  });
}

const selectCls = 'h-control-sm w-full rounded-md border border-border-strong bg-bg px-3 text-base text-fg';

/**
 * Hierarchical topic picker backed by a native <select> (FormData-friendly).
 * Uncontrolled by default; pass `value` + `onChange` for controlled use.
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
}: {
  name: string;
  topics: TopicNode[];
  defaultValue?: string;
  value?: string;
  onChange?: (id: string) => void;
  required?: boolean;
  ariaLabel?: string;
  placeholder?: string;
}): React.ReactElement {
  const options = flattenNumbered(topics);
  const controlled = value !== undefined;
  return (
    <select
      name={name}
      aria-label={ariaLabel}
      required={required}
      {...(controlled ? { value, onChange: (e) => onChange?.(e.target.value) } : { defaultValue })}
      className={selectCls}
    >
      <option value="" disabled={required}>
        {placeholder ?? '—'}
      </option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
