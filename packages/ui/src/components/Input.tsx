'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../cn';
import { useOptionalField } from './Field';

const BASE =
  'w-full rounded-md border bg-bg px-3 text-base text-fg placeholder:text-fg-subtle disabled:cursor-not-allowed disabled:bg-surface-muted';

function stateClasses(invalid: boolean): string {
  return invalid ? 'border-danger' : 'border-border-strong';
}

type FieldCtx = ReturnType<typeof useOptionalField>;

function describedBy(field: FieldCtx): string | undefined {
  if (!field) return undefined;
  return [field.descriptionId, field.errorId].filter(Boolean).join(' ') || undefined;
}

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Text input. Inside a <Field> it auto-wires id + aria-describedby/invalid. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, id, ...rest },
  ref,
) {
  const field = useOptionalField();
  return (
    <input
      ref={ref}
      id={id ?? field?.id}
      aria-invalid={field?.invalid || undefined}
      aria-describedby={describedBy(field)}
      className={cn(BASE, 'h-control-sm', stateClasses(field?.invalid ?? false), className)}
      {...rest}
    />
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, id, rows = 4, ...rest },
  ref,
) {
  const field = useOptionalField();
  return (
    <textarea
      ref={ref}
      id={id ?? field?.id}
      rows={rows}
      aria-invalid={field?.invalid || undefined}
      aria-describedby={describedBy(field)}
      className={cn(BASE, 'py-2', stateClasses(field?.invalid ?? false), className)}
      {...rest}
    />
  );
});
