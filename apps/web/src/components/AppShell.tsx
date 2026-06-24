'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { Menu, X } from 'lucide-react';
import { IconButton, cn } from '@msl/ui';
import { useT } from '@/i18n/client';
import { logoutAction } from '@/lib/auth/actions';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import type { AuthView } from '@/components/auth/authModalTypes';
import { NavDropdown, type NavMenuItem } from '@/components/NavDropdown';
import { MobileNav } from '@/components/MobileNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LocaleSwitch } from '@/components/LocaleSwitch';

export interface NavItem {
  href: string;
  labelKey: string;
  /**
   * When set, the item opens the auth modal at this view instead of navigating.
   * The `href` is kept as a no-JS fallback (the standalone route still exists).
   */
  modal?: AuthView;
  /** When set, the item is a dropdown whose children navigate to sub-pages. */
  children?: NavItem[];
}

export interface AppShellProps {
  /** Localized label announced for the area (e.g. "Teacher area"). */
  areaLabelKey: string;
  navItems: NavItem[];
  /** Authenticated user, if any — shows the name + a logout control. */
  user?: { displayName: string } | null;
  children: React.ReactNode;
}

/**
 * Responsive, mobile-first app shell with a labelled primary nav. Keyboard-
 * operable: the mobile menu toggle uses aria-expanded/controls; all links are
 * standard anchors. The role guard runs server-side in the route-group layout
 * before this renders (RBAC is not UI-only). When `user` is set, a logout button
 * (server action) and the display name are shown.
 */
export function AppShell({
  areaLabelKey,
  navItems,
  user,
  children,
}: AppShellProps): React.ReactElement {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { open: openAuth } = useAuthModal();
  const pathname = usePathname();
  // Pick the single most-specific matching href across the whole nav so a parent
  // route like "/admin" doesn't stay active on "/admin/words" (which kept the
  // pill stuck on the dashboard tab). Longest matching href wins.
  const matchesPath = (href: string): boolean =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  const activeHref = navItems
    .flatMap((item) => [item.href, ...(item.children?.map((c) => c.href) ?? [])])
    .filter(matchesPath)
    .sort((a, b) => b.length - a.length)[0];
  const isActive = (href: string): boolean => href === activeHref;
  // A dropdown is active when its own path or any of its children match (children
  // may live outside the parent's path, e.g. "Learn" → /alphabet, /number).
  const isItemActive = (item: NavItem): boolean =>
    isActive(item.href) || (item.children?.some((c) => isActive(c.href)) ?? false);

  // ── Sliding glass nav pill (presentational) ────────────────────────────────
  // The pill is positioned behind the active top-level desktop tab by reading
  // that <li>'s offsetLeft/offsetWidth. Pure presentation — it does not change
  // routing or which item is active (isItemActive above remains the source).
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [pill, setPill] = useState<{ left: number; width: number; show: boolean }>({
    left: 0,
    width: 0,
    show: false,
  });

  const measurePill = useCallback((): void => {
    const activeIndex = navItems.findIndex((item) => isItemActive(item));
    const el = activeIndex >= 0 ? itemRefs.current[activeIndex] : null;
    if (!el) {
      setPill((p) => (p.show ? { ...p, show: false } : p));
      return;
    }
    setPill({ left: el.offsetLeft, width: el.offsetWidth, show: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navItems, pathname]);

  // Re-measure on route change, viewport resize, and after web fonts settle
  // (display font swap shifts tab widths).
  useEffect(() => {
    measurePill();
    window.addEventListener('resize', measurePill);
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready?.then(measurePill).catch(() => undefined);
    return () => window.removeEventListener('resize', measurePill);
  }, [measurePill]);

  // Signed-in users get an account dropdown under their display name: profile,
  // password reset (the forgot-password modal), and logout.
  const accountItems: NavMenuItem[] = [
    { key: 'profile', label: t('nav.profile'), href: '/profile', active: matchesPath('/profile') },
    { key: 'reset', label: t('auth.forgotTitle'), onSelect: () => openAuth('forgot') },
    {
      key: 'logout',
      label: t('nav.logout'),
      onSelect: () => {
        void logoutAction();
      },
    },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 px-3 pt-3">
        <div className="glass glass-nav mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
          <Link href={'/' as Route} className="flex items-center gap-2 font-display text-lg font-extrabold text-fg">
            {/* <span aria-hidden className="text-2xl">
              🤟
            </span> */}
            {/* <span>{t('app.shortTitle')}</span> */}
            <span>MSL</span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            {/* Desktop nav */}
            <nav aria-label={t(areaLabelKey)}>
              <ul ref={listRef} className="relative flex items-center gap-1">
                {/* Sliding glass pill behind the active tab. */}
                <span
                  aria-hidden
                  className="nav-pill"
                  style={
                    {
                      '--px': `${pill.left}px`,
                      '--pw': `${pill.width}px`,
                      opacity: pill.show ? 1 : 0,
                      zIndex: 0,
                    } as React.CSSProperties
                  }
                />
                {navItems.map((item, i) => {
                  const active = isItemActive(item);
                  // The pill supplies the active background, so the tab itself is
                  // transparent; we only carry text weight/colour here.
                  const className = cn(
                    'inline-flex min-h-touch items-center rounded-[16px] px-4 text-base transition-colors',
                    active
                      ? 'font-semibold text-fg'
                      : 'font-medium text-fg-muted hover:bg-surface-muted hover:text-fg',
                  );
                  return (
                    <li
                      key={item.href}
                      ref={(el) => {
                        itemRefs.current[i] = el;
                      }}
                      className="relative z-10"
                    >
                      {item.children ? (
                        <NavDropdown
                          label={t(item.labelKey)}
                          active={active}
                          triggerClassName={active ? 'bg-transparent hover:bg-transparent font-semibold text-fg' : undefined}
                          items={item.children.map((c) => ({
                            key: c.href,
                            label: t(c.labelKey),
                            href: c.href,
                          }))}
                        />
                      ) : item.modal ? (
                        <button
                          type="button"
                          onClick={() => item.modal && openAuth(item.modal)}
                          className={className}
                        >
                          {t(item.labelKey)}
                        </button>
                      ) : (
                        <Link
                          href={item.href as Route}
                          aria-current={active ? 'page' : undefined}
                          className={className}
                        >
                          {t(item.labelKey)}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
            <LocaleSwitch />
            <ThemeToggle />
            {user ? (
              <div className="flex items-center border-l border-border pl-3">
                <NavDropdown label={user.displayName} align="end" items={accountItems} />
              </div>
            ) : (
              // Guests: two explicit CTAs (no mislabeled "Бүртгүүлэх" dropdown that
              // hid the login action). Login = ghost, Register = primary pill.
              <div className="flex items-center gap-2 border-l border-border pl-3">
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="inline-flex min-h-touch items-center rounded-full px-4 text-base font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
                >
                  {t('nav.login')}
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="inline-flex min-h-touch items-center rounded-full bg-[var(--amber)] px-5 text-base font-semibold text-[#3a2400] transition-colors hover:bg-[var(--amber-deep)]"
                >
                  {t('nav.register')}
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <LocaleSwitch />
            <ThemeToggle />
            <IconButton
              ref={toggleRef}
              label={menuOpen ? t('common.close') : t('common.openMenu')}
              icon={menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((v) => !v)}
              variant="secondary"
            />
          </div>
        </div>

        {/* Mobile nav — accordion sheet with scrim, scroll-lock and focus-trap. */}
        <MobileNav
          areaLabelKey={areaLabelKey}
          navItems={navItems}
          user={user}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          triggerRef={toggleRef}
        />
      </header>

      {children}
    </div>
  );
}
