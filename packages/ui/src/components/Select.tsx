'use client';

import * as RSelect from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
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
  /** Optional icon shown at the trigger's leading edge. */
  leadingIcon?: React.ReactNode;
  className?: string;
}

/**
 * Accessible listbox select (Radix) with a custom, fully styled popup — unlike a
 * native <select>, the dropdown is ours to theme. Liquid-glass surface, brand
 * highlight/checked states, animated entrance (reduced-motion safe via the
 * `.msl-popover` hook), full keyboard support (arrows, type-ahead, Esc), visible
 * focus and ARIA roles. Auto-wires id/aria from a parent <Field>.
 */
export function Select({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder,
  disabled,
  ariaLabel,
  leadingIcon,
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
          'group inline-flex h-control-sm w-full items-center gap-2.5 rounded-md border bg-bg px-3.5 text-base text-fg',
          'data-[placeholder]:text-fg-muted disabled:cursor-not-allowed disabled:bg-surface-muted',
          field?.invalid ? 'border-danger' : 'border-border-strong',
          className,
        )}
      >
        {leadingIcon && (
          <span className="shrink-0 text-fg-muted transition-colors group-data-[state=open]:text-primary [&>svg]:h-4 [&>svg]:w-4">
            {leadingIcon}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-left">
          <RSelect.Value placeholder={placeholder} />
        </span>
        <RSelect.Icon aria-hidden className="shrink-0">
          <ChevronDown className="h-4 w-4 text-fg-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          className={cn(
            'msl-popover glass glass-sm glass-strong z-50 overflow-hidden p-1.5',
            'max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          <RSelect.ScrollUpButton className="flex h-6 cursor-default items-center justify-center text-fg-muted">
            <ChevronUp className="h-4 w-4" aria-hidden />
          </RSelect.ScrollUpButton>
          <RSelect.Viewport className="relative z-[6]">
            {options.map((opt) => (
              <RSelect.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={cn(
                  'relative flex min-h-touch cursor-pointer select-none items-center rounded-lg py-2 pl-9 pr-3 text-base text-fg outline-none transition-colors',
                  'data-[highlighted]:bg-surface-muted data-[highlighted]:text-fg',
                  'data-[state=checked]:font-semibold data-[state=checked]:text-primary',
                  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
                )}
              >
                <RSelect.ItemIndicator className="absolute left-2.5 inline-flex items-center text-primary">
                  <Check className="h-4 w-4" aria-hidden />
                </RSelect.ItemIndicator>
                <RSelect.ItemText>{opt.label}</RSelect.ItemText>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
          <RSelect.ScrollDownButton className="flex h-6 cursor-default items-center justify-center text-fg-muted">
            <ChevronDown className="h-4 w-4" aria-hidden />
          </RSelect.ScrollDownButton>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
