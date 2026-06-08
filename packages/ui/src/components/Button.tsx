'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and sets aria-busy; disables interaction. */
  loading?: boolean;
  /** Stretch to container width. */
  block?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-fg-on-primary hover:bg-primary-hover active:bg-primary-active',
  secondary: 'bg-surface text-fg border border-border-strong hover:bg-surface-muted',
  ghost: 'bg-transparent text-fg hover:bg-surface-muted',
  danger: 'bg-danger text-fg-on-primary hover:opacity-90',
};

// All sizes keep a ≥44px touch target (NFR-01).
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-control-sm px-4 text-sm gap-2',
  md: 'h-control-md px-5 text-base gap-2',
  lg: 'h-control-lg px-6 text-lg gap-2.5',
};

/** Accessible button: keyboard-operable, visible focus, loading state. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, block = false, className, children, disabled, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 aria-hidden className="h-5 w-5 animate-spin" />}
      {children}
    </button>
  );
});
