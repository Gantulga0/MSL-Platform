'use client';

import { ListChecks } from 'lucide-react';
import { useT } from '@/i18n/client';

export interface RuleIndexProps {
  /** i18n keys for each section heading, in order. Index = anchor `#rule-{n}`. */
  titleKeys: string[];
}

/**
 * "On this page" jump navigation for a Дүрэм reference page. Anchor links to each
 * `#rule-{n}` section let readers see the scope of the rule set and jump without
 * scrolling through long Mongolian prose. Plain links → keyboard/SEO friendly
 * (FR-27, NFR-01). Hidden when there is only one section.
 */
export function RuleIndex({ titleKeys }: RuleIndexProps): React.ReactElement | null {
  const t = useT();
  if (titleKeys.length < 2) return null;
  return (
    <nav
      aria-label={t('rules.onThisPage')}
      className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"
    >
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-fg-subtle">
        <ListChecks aria-hidden className="h-4 w-4" />
        {t('rules.onThisPage')}
      </p>
      <ol className="mt-3 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-2">
        {titleKeys.map((key, i) => (
          <li key={key} className="sm:flex-1">
            <a
              href={`#rule-${i + 1}`}
              className="flex min-h-touch items-start gap-2.5 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-fg transition-colors hover:border-border hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="grid h-6 w-6 shrink-0 place-content-center rounded-full bg-accent-subtle text-xs font-bold text-accent-ink">
                {i + 1}
              </span>
              <span className="leading-snug [text-wrap:balance]">{t(key)}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
