'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: accessible name announced to screen readers (no visible text). */
  label: string;
  icon: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const VARIANTS = {
  primary: 'bg-primary text-fg-on-primary hover:bg-primary-hover',
  secondary: 'bg-surface text-fg border border-border-strong hover:bg-surface-muted',
  ghost: 'bg-transparent text-fg hover:bg-surface-muted',
} as const;

/** Icon-only button. `label` is mandatory so it is never unlabeled (NFR-01). */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'ghost', className, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex min-h-touch min-w-touch items-center justify-center rounded-md transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      <span aria-hidden className="inline-flex h-6 w-6 items-center justify-center">
        {icon}
      </span>
    </button>
  );
});
