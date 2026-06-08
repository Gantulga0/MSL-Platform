'use client';

import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Friendly empty/zero-result state with optional call to action. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <span aria-hidden className="inline-flex h-12 w-12 items-center justify-center text-fg-subtle">
          {icon}
        </span>
      )}
      <p className="text-lg font-semibold text-fg">{title}</p>
      {description && <p className="max-w-md text-base text-fg-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
