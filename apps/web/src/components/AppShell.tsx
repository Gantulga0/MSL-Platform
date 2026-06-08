'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Menu, X } from 'lucide-react';
import { IconButton } from '@msl/ui';
import { translate } from '@/i18n';

export interface NavItem {
  href: string;
  labelKey: string;
}

export interface AppShellProps {
  /** Localized label announced for the area (e.g. "Teacher area"). */
  areaLabelKey: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

/**
 * Responsive, mobile-first app shell with a labelled primary nav. Keyboard-
 * operable: the mobile menu toggle uses aria-expanded/controls; all links are
 * standard anchors. The role guard runs server-side in the route-group layout
 * before this renders (RBAC is not UI-only).
 */
export function AppShell({ areaLabelKey, navItems, children }: AppShellProps): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href={'/' as Route} className="flex items-center gap-2 font-bold text-fg">
            <span aria-hidden className="text-2xl">
              🤟
            </span>
            <span>{translate('app.shortTitle')}</span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label={translate(areaLabelKey)} className="hidden md:block">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href as Route}
                    className="inline-flex min-h-touch items-center rounded-md px-3 text-base font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
                  >
                    {translate(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

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
          <nav id="mobile-nav" aria-label={translate(areaLabelKey)} className="border-t border-border md:hidden">
            <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href as Route}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-touch items-center rounded-md px-3 text-base font-medium text-fg hover:bg-surface-muted"
                  >
                    {translate(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {children}
    </div>
  );
}
