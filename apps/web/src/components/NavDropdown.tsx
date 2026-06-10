'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ChevronDown } from 'lucide-react';
import { cn } from '@msl/ui';

/** One entry in a {@link NavDropdown} menu — either a link or an action. */
export interface NavMenuItem {
  key: string;
  label: string;
  /** Navigates here when chosen (rendered as a Link). */
  href?: string;
  /** Called when chosen (rendered as a button). Takes precedence over `href`. */
  onSelect?: () => void;
}

export interface NavDropdownProps {
  /** Trigger label. */
  label: string;
  items: NavMenuItem[];
  /** Highlights the trigger as the active section. */
  active?: boolean;
  /** Horizontal alignment of the menu panel relative to the trigger. */
  align?: 'start' | 'end';
  /** Extra classes for the trigger button (to match surrounding nav items). */
  triggerClassName?: string;
}

/**
 * Accessible navigation dropdown (menu button pattern, WCAG 2.2 AA / FR-27).
 * Keyboard-operable: Enter/Space/ArrowDown open and focus the first item;
 * ArrowUp/ArrowDown + Home/End move focus; Esc closes and returns focus to the
 * trigger; Tab closes; an outside click closes. Built with plain React + ARIA so
 * it adds no new dependency and matches the existing nav styling.
 */
export function NavDropdown({
  label,
  items,
  active,
  align = 'start',
  triggerClassName,
}: NavDropdownProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([]);

  // Close on outside pointer-down.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent): void {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function focusItem(index: number): void {
    const count = items.length;
    const next = ((index % count) + count) % count;
    itemRefs.current[next]?.focus();
  }

  function openAndFocus(index: number): void {
    setOpen(true);
    // Items mount on open; defer focus to the next frame.
    requestAnimationFrame(() => focusItem(index));
  }

  function onTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>): void {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openAndFocus(0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openAndFocus(items.length - 1);
    }
  }

  function close(focusTrigger: boolean): void {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }

  function onMenuKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close(true);
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusItem(current + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusItem(current - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusItem(0);
        break;
      case 'End':
        e.preventDefault();
        focusItem(items.length - 1);
        break;
      case 'Tab':
        // Let focus leave naturally, just close the panel.
        setOpen(false);
        break;
      default:
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'inline-flex min-h-touch items-center gap-1 rounded-full px-4 text-base transition-colors',
          active || open
            ? 'bg-surface-muted font-semibold text-fg'
            : 'font-medium text-fg-muted hover:bg-surface-muted hover:text-fg',
          triggerClassName,
        )}
      >
        {label}
        <ChevronDown aria-hidden className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={cn(
            'absolute top-full z-40 mt-2 min-w-60 rounded-xl border border-border bg-bg p-1 shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, i) => {
            const className =
              'flex min-h-touch w-full items-center rounded-lg px-3 text-left text-base text-fg transition-colors hover:bg-surface-muted focus:bg-surface-muted';
            if (item.onSelect) {
              return (
                <button
                  key={item.key}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => {
                    item.onSelect?.();
                    close(false);
                  }}
                  className={className}
                >
                  {item.label}
                </button>
              );
            }
            return (
              <Link
                key={item.key}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                href={(item.href ?? '#') as Route}
                role="menuitem"
                tabIndex={-1}
                onClick={() => close(false)}
                className={className}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
