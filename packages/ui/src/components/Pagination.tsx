'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** i18n labels. `goTo` names a numbered page button for assistive tech. */
  labels: {
    nav: string;
    previous: string;
    next: string;
    page: (p: number, total: number) => string;
    goTo?: (p: number) => string;
  };
  className?: string;
}

/** A gap marker in the page window — collapses a run of hidden pages. */
const GAP = 'gap' as const;
type Slot = number | typeof GAP;

/**
 * Windowed page list: always the first and last page, the current page and one
 * neighbour each side, with a single ellipsis collapsing each hidden run. Keeps
 * the pager a fixed, compact width no matter how many pages exist.
 */
function pageWindow(page: number, total: number): Slot[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const slots: Slot[] = [1];
  const left = Math.max(2, page - 1);
  const right = Math.min(total - 1, page + 1);
  if (left > 2) slots.push(GAP);
  for (let p = left; p <= right; p += 1) slots.push(p);
  if (right < total - 1) slots.push(GAP);
  slots.push(total);
  return slots;
}

/**
 * Keyboard-operable pager rendered as one cohesive glass pill: chevron
 * prev/next flank a windowed run of numbered pages (current page filled with the
 * brand primary). On narrow screens the numbers collapse to a compact
 * "page X of Y" status so the control never overflows.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  labels,
  className,
}: PaginationProps): React.ReactElement {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const slots = pageWindow(page, totalPages);

  const arrow =
    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-fg transition-colors hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

  return (
    <nav
      aria-label={labels.nav}
      className={cn('flex justify-center', className)}
    >
      <div className="glass-field inline-flex items-center gap-1 rounded-full p-1.5">
        <button
          type="button"
          className={arrow}
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label={labels.previous}
        >
          <ChevronLeft aria-hidden className="h-5 w-5" />
        </button>

        {/* Numbered window — desktop/tablet. */}
        <ul className="hidden items-center gap-1 sm:flex">
          {slots.map((slot, i) => {
            if (slot === GAP) {
              return (
                <li
                  key={`gap-${i}`}
                  aria-hidden
                  className="flex h-11 w-7 items-center justify-center text-fg-subtle"
                >
                  …
                </li>
              );
            }
            const active = slot === page;
            return (
              <li key={slot}>
                <button
                  type="button"
                  onClick={() => onPageChange(slot)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={labels.goTo?.(slot)}
                  className={cn(
                    'inline-flex h-11 min-w-11 items-center justify-center rounded-full px-2 text-sm font-bold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    active
                      ? 'bg-primary text-fg-on-primary shadow-[0_6px_16px_-8px_var(--sky)]'
                      : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
                  )}
                >
                  {slot}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Compact status — mobile. */}
        <span
          aria-live="polite"
          className="px-3 text-sm font-semibold tabular-nums text-fg-muted sm:hidden"
        >
          {labels.page(page, totalPages)}
        </span>

        <button
          type="button"
          className={arrow}
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label={labels.next}
        >
          <ChevronRight aria-hidden className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
}
