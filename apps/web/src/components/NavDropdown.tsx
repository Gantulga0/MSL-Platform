'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Check, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@msl/ui';

/** One entry in a {@link NavDropdown} menu — either a link or an action. */
export interface NavMenuItem {
  key: string;
  label: string;
  /** Navigates here when chosen (rendered as a Link). */
  href?: string;
  /** Called when chosen (rendered as a button). Takes precedence over `href`. */
  onSelect?: () => void;
  /** Optional leading icon. */
  icon?: React.ReactNode;
  /** Optional secondary description line under the label. */
  description?: string;
  /** Marks the item as the current route (renders a trailing checkmark). */
  active?: boolean;
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
 * trigger; Tab closes; an outside click closes. This revision adds Framer Motion
 * enter/exit (top-origin), an optional per-item icon + description, and a
 * checkmark on the active route for orientation. Honours reduced-motion.
 */
export function NavDropdown({
  label,
  items,
  active,
  align = 'start',
  triggerClassName,
}: NavDropdownProps): React.ReactElement {
  const reduce = useReducedMotion();
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

  const itemCls =
    'relative z-[6] flex min-h-touch w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-base text-fg transition-colors hover:bg-surface-muted focus:bg-surface-muted focus-visible:outline-none';

  function renderInner(item: NavMenuItem): React.ReactNode {
    return (
      <>
        {item.icon && (
          <span aria-hidden className="grid h-5 w-5 shrink-0 place-content-center text-fg-muted">
            {item.icon}
          </span>
        )}
        <span className="flex-1">
          <span className="block font-medium leading-snug">{item.label}</span>
          {item.description && <span className="block text-xs text-fg-muted">{item.description}</span>}
        </span>
        {item.active && <Check aria-hidden className="h-4 w-4 shrink-0 text-primary" />}
      </>
    );
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
          // rounded-[16px] matches the plain nav tabs' hover/active shape so the
          // dropdown triggers (Learn / Rules) don't read as fuller pills.
          'inline-flex min-h-touch items-center gap-1 rounded-[16px] px-4 text-base transition-colors',
          active || open
            ? 'bg-surface-muted font-semibold text-fg'
            : 'font-medium text-fg-muted hover:bg-surface-muted hover:text-fg',
          triggerClassName,
        )}
      >
        {label}
        <ChevronDown aria-hidden className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: align === 'end' ? 'top right' : 'top left' }}
            className={cn(
              // Size to the widest item (so long Rules labels stay readable),
              // floored at 16rem and capped so it never overflows the viewport.
              'glass glass-sm glass-strong absolute top-full z-40 mt-2 w-max min-w-64 max-w-[min(24rem,calc(100vw-1.5rem))] p-1.5',
              align === 'end' ? 'right-0' : 'left-0',
            )}
          >
            {items.map((item, i) =>
              item.onSelect ? (
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
                  className={itemCls}
                >
                  {renderInner(item)}
                </button>
              ) : (
                <Link
                  key={item.key}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  href={(item.href ?? '#') as Route}
                  role="menuitem"
                  tabIndex={-1}
                  aria-current={item.active ? 'page' : undefined}
                  onClick={() => close(false)}
                  className={itemCls}
                >
                  {renderInner(item)}
                </Link>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
