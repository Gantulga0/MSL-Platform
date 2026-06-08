'use client';

import * as RTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  /** Accessible label for the tablist. */
  ariaLabel: string;
  className?: string;
}

/**
 * Tabs (Radix): roving tabindex, arrow-key navigation, ARIA tablist/tab/tabpanel.
 */
export function Tabs({
  items,
  defaultValue,
  value,
  onValueChange,
  ariaLabel,
  className,
}: TabsProps): React.ReactElement {
  return (
    <RTabs.Root
      defaultValue={defaultValue ?? items[0]?.value}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <RTabs.List
        aria-label={ariaLabel}
        className="flex gap-1 border-b border-border"
      >
        {items.map((item) => (
          <RTabs.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'min-h-touch px-4 py-2 text-base font-medium text-fg-muted',
              'border-b-2 border-transparent -mb-px',
              'data-[state=active]:border-primary data-[state=active]:text-primary',
              'hover:text-fg',
            )}
          >
            {item.label}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {items.map((item) => (
        <RTabs.Content key={item.value} value={item.value} className="pt-4 focus:outline-none">
          {item.content}
        </RTabs.Content>
      ))}
    </RTabs.Root>
  );
}
