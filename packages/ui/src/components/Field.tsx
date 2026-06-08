'use client';

import { createContext, useContext, useId, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../cn';

interface FieldContextValue {
  id: string;
  descriptionId?: string;
  errorId?: string;
  invalid: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/** Access field wiring (id + aria-describedby) from a control inside a Field. */
export function useField(): FieldContextValue {
  const ctx = useContext(FieldContext);
  if (!ctx) throw new Error('useField must be used within <Field>');
  return ctx;
}

/** Non-throwing variant: returns null when used outside a <Field>. */
export function useOptionalField(): FieldContextValue | null {
  return useContext(FieldContext);
}

export interface FieldProps {
  label: string;
  /** Optional helper text shown under the label. */
  description?: string;
  /** Error message — rendered with an icon + text, never color-only (NFR-01). */
  error?: string;
  required?: boolean;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Form field wrapper: associates a <label>, optional description and error with
 * its control via aria-describedby / aria-invalid. Inline validation text is
 * paired with an icon so the error is not signalled by color alone.
 */
export function Field({
  label,
  description,
  error,
  required,
  hideLabel,
  children,
  className,
}: FieldProps): React.ReactElement {
  const id = useId();
  const descriptionId = description ? `${id}-desc` : undefined;
  const errorId = error ? `${id}-err` : undefined;
  const invalid = Boolean(error);

  return (
    <FieldContext.Provider value={{ id, descriptionId, errorId, invalid }}>
      <div className={cn('flex flex-col gap-1.5', className)}>
        <label htmlFor={id} className={cn('text-sm font-medium text-fg', hideLabel && 'sr-only')}>
          {label}
          {required && (
            <span className="ml-1 text-danger" aria-hidden>
              *
            </span>
          )}
        </label>
        {description && (
          <p id={descriptionId} className="text-sm text-fg-muted">
            {description}
          </p>
        )}
        {children}
        {error && (
          <p id={errorId} role="alert" className="flex items-center gap-1.5 text-sm font-medium text-danger">
            <AlertCircle aria-hidden className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}
