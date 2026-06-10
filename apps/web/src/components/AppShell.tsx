'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { LogOut, Menu, X } from 'lucide-react';
import { Button, IconButton, cn } from '@msl/ui';
import { translate } from '@/i18n';
import { logoutAction } from '@/lib/auth/actions';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import type { AuthView } from '@/components/auth/authModalTypes';
import { NavDropdown } from '@/components/NavDropdown';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const { open: openAuth } = useAuthModal();
  const pathname = usePathname();
  // Active when the path equals the item, or is nested under it (but '/' only on exact).
  const isActive = (href: string): boolean =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  const logout = (
    <form action={logoutAction}>
      <Button type="submit" variant="secondary" size="sm">
        <LogOut aria-hidden className="h-4 w-4" />
        {translate('nav.logout')}
      </Button>
    </form>
  );

  // Guests see a single "Бүртгүүлэх" dropdown that reveals register + login.
  const authItems = [
    { key: 'register', label: translate('nav.register'), onSelect: () => openAuth('register') },
    { key: 'login', label: translate('nav.login'), onSelect: () => openAuth('login') },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href={'/' as Route} className="flex items-center gap-2 text-lg font-bold text-fg">
            {/* <span aria-hidden className="text-2xl">
              🤟
            </span> */}
            {/* <span>{translate('app.shortTitle')}</span> */}
            <span>MSL</span>
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            {/* Desktop nav */}
            <nav aria-label={translate(areaLabelKey)}>
              <ul className="flex items-center gap-1">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const className = cn(
                    'inline-flex min-h-touch items-center rounded-full px-4 text-base transition-colors',
                    active
                      ? 'bg-surface-muted font-semibold text-fg'
                      : 'font-medium text-fg-muted hover:bg-surface-muted hover:text-fg',
                  );
                  return (
                    <li key={item.href}>
                      {item.children ? (
                        <NavDropdown
                          label={translate(item.labelKey)}
                          active={active}
                          items={item.children.map((c) => ({
                            key: c.href,
                            label: translate(c.labelKey),
                            href: c.href,
                          }))}
                        />
                      ) : item.modal ? (
                        <button
                          type="button"
                          onClick={() => item.modal && openAuth(item.modal)}
                          className={className}
                        >
                          {translate(item.labelKey)}
                        </button>
                      ) : (
                        <Link
                          href={item.href as Route}
                          aria-current={active ? 'page' : undefined}
                          className={className}
                        >
                          {translate(item.labelKey)}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
            {user ? (
              <div className="flex items-center gap-3 border-l border-border pl-4">
                <span className="text-sm font-medium text-fg">{user.displayName}</span>
                {logout}
              </div>
            ) : (
              <div className="flex items-center border-l border-border pl-4">
                <NavDropdown label={translate('nav.register')} align="end" items={authItems} />
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden">
            <IconButton
              label={menuOpen ? translate('common.close') : translate('common.openMenu')}
              icon={menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((v) => !v)}
              variant="secondary"
            />
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav
            id="mobile-nav"
            aria-label={translate(areaLabelKey)}
            className="border-t border-border md:hidden"
          >
            <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const className = cn(
                  'flex min-h-touch items-center rounded-full px-4 text-base hover:bg-surface-muted',
                  active ? 'bg-surface-muted font-semibold text-fg' : 'font-medium text-fg',
                );
                if (item.children) {
                  // Mobile: no popup — show the section label, then its links indented.
                  return (
                    <li key={item.href}>
                      <span className="block px-4 pb-1 pt-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
                        {translate(item.labelKey)}
                      </span>
                      <ul>
                        {item.children.map((child) => {
                          const childActive = isActive(child.href);
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href as Route}
                                aria-current={childActive ? 'page' : undefined}
                                onClick={() => setMenuOpen(false)}
                                className={cn(className, 'pl-7')}
                              >
                                {translate(child.labelKey)}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                }
                return (
                  <li key={item.href}>
                    {item.modal ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          if (item.modal) openAuth(item.modal);
                        }}
                        className={cn(className, 'w-full text-left')}
                      >
                        {translate(item.labelKey)}
                      </button>
                    ) : (
                      <Link
                        href={item.href as Route}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => setMenuOpen(false)}
                        className={className}
                      >
                        {translate(item.labelKey)}
                      </Link>
                    )}
                  </li>
                );
              })}
              {user ? (
                <li className="mt-2 border-t border-border pt-2">
                  <span className="block px-3 py-1 text-sm font-medium text-fg-muted">
                    {user.displayName}
                  </span>
                  {logout}
                </li>
              ) : (
                <li className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
                  {authItems.map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        a.onSelect();
                      }}
                      className={cn(
                        'flex min-h-touch w-full items-center rounded-full px-4 text-left text-base font-medium text-fg hover:bg-surface-muted',
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>

      {children}
    </div>
  );
}
