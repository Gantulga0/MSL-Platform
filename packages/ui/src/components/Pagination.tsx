'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** i18n labels. */
  labels: { nav: string; previous: string; next: string; page: (p: number, total: number) => string };
  className?: string;
}

/** Keyboard-operable pager with an accessible <nav> and current-page status. */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  labels,
  className,
}: PaginationProps): React.ReactElement {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const btn =
    'inline-flex min-h-touch min-w-touch items-center gap-1 rounded-full border border-border-strong bg-surface px-4 font-medium text-fg transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface-muted';

  return (
    <nav aria-label={labels.nav} className={cn('flex items-center justify-between gap-4', className)}>
      <button type="button" className={btn} onClick={() => onPageChange(page - 1)} disabled={!canPrev}>
        <ChevronLeft aria-hidden className="h-5 w-5" />
        {labels.previous}
      </button>
      <span aria-live="polite" className="text-sm font-medium text-fg-muted">
        {labels.page(page, totalPages)}
      </span>
      <button type="button" className={btn} onClick={() => onPageChange(page + 1)} disabled={!canNext}>
        {labels.next}
        <ChevronRight aria-hidden className="h-5 w-5" />
      </button>
    </nav>
  );
}
