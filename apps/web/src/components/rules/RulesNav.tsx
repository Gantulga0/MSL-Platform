'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { translate as t } from '@/i18n';

const TABS = [
  { href: '/rules/standard', labelKey: 'nav.rulesStandard' },
  { href: '/rules/structure', labelKey: 'nav.rulesStructure' },
  { href: '/rules/mouthing', labelKey: 'nav.rulesMouthing' },
] as const;

/**
 * Segmented control across the three "Дүрэм" topics. The active background is a
 * single shared `layoutId` pill so it slides between tabs (Framer Motion); honours
 * reduced-motion. Plain links → keyboard/SEO friendly, and the active state mirrors
 * the current route (NFR-01 / FR-27). Lets readers see the scope of the rule set
 * and move between topics without using the browser back button.
 */
export function RulesNav(): React.ReactElement {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  return (
    <nav aria-label={t('nav.rules')} className="mx-auto max-w-3xl">
      <ul className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-1.5 shadow-sm sm:flex-row">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href} className="relative flex-1">
              <Link
                href={tab.href as Route}
                aria-current={active ? 'page' : undefined}
                className="relative flex min-h-touch items-center justify-center rounded-xl px-4 py-2 text-center text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {active && (
                  <motion.span
                    layoutId="rules-tab-pill"
                    aria-hidden
                    className="absolute inset-0 rounded-xl bg-primary"
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className={active ? 'relative z-10 font-semibold text-fg-on-primary' : 'relative z-10 text-fg-muted'}>
                  {t(tab.labelKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
