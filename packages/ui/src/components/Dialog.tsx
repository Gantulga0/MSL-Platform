'use client';

import * as RDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../cn';
import { IconButton } from './IconButton';
import { VisuallyHidden } from './VisuallyHidden';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the dialog (Radix asChild trigger). */
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Accessible label for the close button (i18n). */
  closeLabel: string;
  className?: string;
}

/**
 * Modal dialog (Radix): focus trap, Esc-to-close, scroll lock, ARIA
 * (role=dialog, aria-modal, labelled/described by title + description),
 * focus return to trigger on close. Fully keyboard-operable (FR-27).
 */
export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  closeLabel,
  className,
}: DialogProps): React.ReactElement {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RDialog.Trigger asChild>{trigger}</RDialog.Trigger>}
      <RDialog.Portal>
        <RDialog.Overlay className="msl-overlay fixed inset-0 z-40 bg-overlay" />
        <RDialog.Content
          className={cn(
            'msl-dialog fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2',
            'rounded-lg border border-border bg-bg p-6 shadow-lg focus:outline-none',
            className,
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <RDialog.Title className="text-xl font-semibold text-fg">{title}</RDialog.Title>
              {description && (
                <RDialog.Description className="mt-1 text-base text-fg-muted">
                  {description}
                </RDialog.Description>
              )}
            </div>
            <RDialog.Close asChild>
              <IconButton label={closeLabel} icon={<X className="h-5 w-5" />} />
            </RDialog.Close>
          </div>
          <div className="text-base text-fg">{children}</div>
          {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

export interface DialogShellProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name for the dialog (rendered visually-hidden as the Radix Title). */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Chrome-less modal shell — same Radix behaviours as `Dialog` (focus trap,
 * Esc-to-close, overlay-click, scroll lock, role=dialog/aria-modal, focus return
 * to trigger) but with NO card/title/close chrome. The caller's `children` own the
 * entire visual presentation. The accessible name comes from a visually-hidden
 * Title (`label`); `aria-describedby` is cleared since there is no description.
 */
export function DialogShell({
  open,
  onOpenChange,
  label,
  children,
  className,
}: DialogShellProps): React.ReactElement {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="msl-overlay fixed inset-0 z-40 bg-overlay" />
        <RDialog.Content
          aria-describedby={undefined}
          className={cn(
            'msl-dialog fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 focus:outline-none',
            className,
          )}
        >
          <VisuallyHidden>
            <RDialog.Title>{label}</RDialog.Title>
          </VisuallyHidden>
          {children}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
