'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { ChevronDown, X } from 'lucide-react';
import { IconButton, cn } from '@msl/ui';
import { useT } from '@/i18n/client';
import { logoutAction } from '@/lib/auth/actions';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import type { NavItem } from '@/components/AppShell';

interface MobileNavProps {
  /** Localized aria-label for the nav landmark (also a quiet panel kicker). */
  areaLabelKey: string;
  navItems: NavItem[];
  /** Authenticated user, if any — shows the name + account actions. */
  user?: { displayName: string } | null;
  open: boolean;
  onClose: () => void;
  /** Returns focus to the hamburger trigger after the menu closes. */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Mobile navigation sheet. Sections with children (Сурах, Дүрэм) are single-open
 * accordions — collapsed by default, expanded by tapping their uppercase trigger;
 * plain destinations stay direct links. Behaves like a dialog: a dimmed + blurred
 * scrim covers the page, body scroll is locked, Esc / scrim-tap close it, focus is
 * trapped inside, and focus returns to the hamburger on close (NFR-01, FR-27). The
 * panel height is bounded so a long menu scrolls within itself while the close (X)
 * stays pinned at the top. Desktop nav is untouched (this is `md:hidden`).
 */
export function MobileNav({
  areaLabelKey,
  navItems,
  user,
  open,
  onClose,
  triggerRef,
}: MobileNavProps): React.ReactElement | null {
  const t = useT();
  const pathname = usePathname();
  const { open: openAuth } = useAuthModal();
  const panelRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  const isActive = (href: string): boolean =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  const activeParentHref =
    navItems.find((it) => it.children?.some((c) => isActive(c.href)))?.href ?? null;

  // Single-open accordion. Reset each time the menu opens: collapsed, except the
  // section that holds the current route (orientation).
  const [openSection, setOpenSection] = useState<string | null>(null);
  useEffect(() => {
    if (open) setOpenSection(activeParentHref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus trap + Esc. Focusables are recomputed on each Tab so expanding an
  // accordion includes its freshly revealed links.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = (): HTMLElement[] =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
    focusables()[0]?.focus();
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Return focus to the trigger when the menu closes.
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open, triggerRef]);

  if (!open) return null;

  const rowBase =
    'flex min-h-touch items-center rounded-full px-4 text-base hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

  const accountItems = [
    { key: 'profile', label: t('nav.profile'), href: '/profile' as const, onSelect: undefined },
    { key: 'reset', label: t('auth.forgotTitle'), href: undefined, onSelect: () => openAuth('forgot') },
    {
      key: 'logout',
      label: t('nav.logout'),
      href: undefined,
      onSelect: () => {
        void logoutAction();
      },
    },
  ];
  const authItems = [
    { key: 'register', label: t('nav.register'), onSelect: () => openAuth('register') },
    { key: 'login', label: t('nav.login'), onSelect: () => openAuth('login') },
  ];

  return (
    <>
      {/* Scrim — dims + blurs the whole page behind the sheet; tap to dismiss. */}
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-20 bg-[var(--c-overlay)] backdrop-blur-sm md:hidden"
      />

      <nav
        ref={panelRef}
        id="mobile-nav"
        aria-label={t(areaLabelKey)}
        className="glass glass-strong relative z-30 mx-auto mt-2 flex max-h-[calc(100dvh-5.5rem)] max-w-7xl flex-col overflow-hidden md:hidden"
      >
        {/* Close row — flex-none, so it stays put while the list scrolls below. */}
        <div className="relative z-[6] flex flex-none items-center justify-between gap-2 border-b border-border px-3 py-2">
          <span className="px-1 font-display text-xs font-bold uppercase tracking-[0.16em] text-fg-muted">
            {t(areaLabelKey)}
          </span>
          <IconButton
            label={t('common.close')}
            icon={<X className="h-6 w-6" />}
            onClick={onClose}
            variant="ghost"
          />
        </div>

        <ul className="relative z-[6] flex min-h-0 flex-col gap-0.5 overflow-y-auto px-3 py-3">
          {navItems.map((item) => {
            if (item.children) {
              const sectionOpen = openSection === item.href;
              const panelId = `mnav-${item.href}`;
              const anyChildActive = item.children.some((c) => isActive(c.href));
              return (
                <li key={item.href}>
                  <button
                    type="button"
                    aria-expanded={sectionOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenSection(sectionOpen ? null : item.href)}
                    className={cn(
                      'flex min-h-touch w-full items-center justify-between gap-2 rounded-full px-4 text-left text-xs font-bold uppercase tracking-[0.14em] hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      anyChildActive ? 'text-fg' : 'text-fg-muted',
                    )}
                  >
                    <span className="font-display">{t(item.labelKey)}</span>
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none',
                        sectionOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  {/* Smooth height via grid-rows 0fr→1fr (no JS measuring). */}
                  <div
                    id={panelId}
                    className={cn(
                      'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
                      sectionOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    )}
                  >
                    <ul className="min-h-0 overflow-hidden">
                      {item.children.map((child) => {
                        const childActive = isActive(child.href);
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href as Route}
                              aria-current={childActive ? 'page' : undefined}
                              tabIndex={sectionOpen ? undefined : -1}
                              onClick={onClose}
                              className={cn(
                                rowBase,
                                'ml-3 mt-0.5',
                                childActive
                                  ? 'bg-surface-muted font-semibold text-fg'
                                  : 'font-medium text-fg',
                              )}
                            >
                              {t(child.labelKey)}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            }

            const active = isActive(item.href);
            return (
              <li key={item.href}>
                {item.modal ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (item.modal) openAuth(item.modal);
                    }}
                    className={cn(rowBase, 'w-full text-left font-medium text-fg')}
                  >
                    {t(item.labelKey)}
                  </button>
                ) : (
                  <Link
                    href={item.href as Route}
                    aria-current={active ? 'page' : undefined}
                    onClick={onClose}
                    className={cn(
                      rowBase,
                      active ? 'bg-surface-muted font-semibold text-fg' : 'font-medium text-fg',
                    )}
                  >
                    {t(item.labelKey)}
                  </Link>
                )}
              </li>
            );
          })}

          {/* Auth / account actions — set apart by a divider. */}
          {user ? (
            <li className="mt-2 flex flex-col gap-1 border-t border-border pt-3">
              <span className="px-4 pb-1 text-sm font-medium text-fg-muted">{user.displayName}</span>
              {accountItems.map((a) =>
                a.href ? (
                  <Link
                    key={a.key}
                    href={a.href as Route}
                    onClick={onClose}
                    className={cn(rowBase, 'font-medium text-fg')}
                  >
                    {a.label}
                  </Link>
                ) : (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => {
                      onClose();
                      a.onSelect?.();
                    }}
                    className={cn(rowBase, 'w-full text-left font-medium text-fg')}
                  >
                    {a.label}
                  </button>
                ),
              )}
            </li>
          ) : (
            <li className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {authItems.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => {
                    onClose();
                    a.onSelect();
                  }}
                  className={cn(
                    'flex min-h-touch w-full items-center justify-center rounded-full px-4 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    a.key === 'register'
                      ? 'bg-[var(--amber)] font-semibold text-[#3a2400] hover:bg-[var(--amber-deep)]'
                      : 'font-medium text-fg hover:bg-surface-muted',
                  )}
                >
                  {a.label}
                </button>
              ))}
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
