'use client';

import { useState } from 'react';
import { cn } from '@msl/ui';

export interface PickerOption {
  id: string;
  label: string;
  imageUrl?: string | null;
}

/**
 * Accessible image-based option picker for the admin word form (FR-27, NFR-01).
 * Renders each option as a keyboard-operable card (≥44px) showing its image with
 * a text label fallback, and mirrors the current selection into hidden inputs so
 * it works inside a plain FormData `<form>`. Single- or multi-select.
 */
export function ImagePicker({
  name,
  options,
  multiple = false,
  columns = 3,
  imageOnly = false,
  defaultSelected = [],
  onChange,
}: {
  name: string;
  options: PickerOption[];
  multiple?: boolean;
  columns?: 2 | 3;
  /** Show only the image; the label becomes the (visually hidden) accessible name. */
  imageOnly?: boolean;
  /** Initially-selected option ids (e.g. prefilled from a submission). */
  defaultSelected?: string[];
  /** Fires with the current selection — for parents that build FormData manually. */
  onChange?: (ids: string[]) => void;
}): React.ReactElement {
  const [selected, setSelected] = useState<string[]>(defaultSelected);

  function toggle(id: string): void {
    const next = multiple
      ? selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
      : selected[0] === id
        ? []
        : [id];
    // Update own state and notify the parent separately — calling onChange inside
    // the setState updater fires it during render (React "setState in render" warning).
    setSelected(next);
    onChange?.(next);
  }

  return (
    <div>
      <div
        role={multiple ? 'group' : 'radiogroup'}
        className={cn('grid gap-2', columns === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}
      >
        {options.map((o) => {
          const active = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              role={multiple ? 'checkbox' : 'radio'}
              aria-checked={active}
              // Image-only: keep an accessible name for screen readers.
              aria-label={imageOnly ? o.label : undefined}
              onClick={() => toggle(o.id)}
              className={cn(
                'flex min-h-touch flex-col items-center gap-1 rounded-lg border-2 p-2 text-center transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                active
                  ? 'border-primary bg-primary/10 text-fg ring-2 ring-primary'
                  : 'border-border-strong bg-bg text-fg-muted hover:bg-surface-muted',
              )}
            >
              <span className="flex h-16 w-full items-center justify-center overflow-hidden rounded-md bg-surface-muted">
                {o.imageUrl ? (
                  // The label (visible or aria) carries the name; image is decorative.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.imageUrl}
                    alt=""
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                    }}
                  />
                ) : (
                  <span aria-hidden className="text-2xl">🖐️</span>
                )}
              </span>
              {!imageOnly && <span className="text-xs font-medium leading-tight">{o.label}</span>}
            </button>
          );
        })}
      </div>
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
