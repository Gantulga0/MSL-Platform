'use client';

import * as RSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../cn';
import { useOptionalField } from './Field';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Accessible name when not wrapped in a <Field>. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Accessible listbox select (Radix). Full keyboard support (arrows, type-ahead,
 * Esc), visible focus, ARIA roles. Auto-wires id/aria from a parent <Field>.
 */
export function Select({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder,
  disabled,
  ariaLabel,
  className,
}: SelectProps): React.ReactElement {
  const field = useOptionalField();
  return (
    <RSelect.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled}>
      <RSelect.Trigger
        id={field?.id}
        aria-label={ariaLabel}
        aria-invalid={field?.invalid || undefined}
        className={cn(
          'inline-flex h-control-sm w-full items-center justify-between gap-2 rounded-md border bg-bg px-3 text-base text-fg',
          'disabled:cursor-not-allowed disabled:bg-surface-muted',
          field?.invalid ? 'border-danger' : 'border-border-strong',
          className,
        )}
      >
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon aria-hidden>
          <ChevronDown className="h-5 w-5 text-fg-muted" />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-bg shadow-lg"
        >
          <RSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RSelect.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={cn(
                  'relative flex min-h-touch cursor-pointer select-none items-center rounded-sm py-2 pl-9 pr-3 text-base text-fg outline-none',
                  'data-[highlighted]:bg-primary-subtle data-[highlighted]:text-primary',
                  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
                )}
              >
                <RSelect.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <Check className="h-4 w-4" aria-hidden />
                </RSelect.ItemIndicator>
                <RSelect.ItemText>{opt.label}</RSelect.ItemText>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
