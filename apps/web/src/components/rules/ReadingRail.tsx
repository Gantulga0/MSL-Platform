'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/client';

export interface ReadingRailProps {
  /** i18n keys for each section heading, in order. Index = anchor `#rule-{n}`. */
  titleKeys: string[];
}

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/**
 * Signature element of the "Дүрэм" pages: a sticky vertical "gesture-trail" spine
 * that traces the reader's progress down the page — embodying the design thesis
 * *"дохио бол хөдөлгөөн"* (a sign is motion). An amber line draws downward and a
 * hand-node descends as you scroll, passing each rule's station. Doubles as the
 * section navigation, replacing the floating "Энэ хуудсанд" box on desktop.
 *
 * Stations are real `#rule-{n}` anchors (keyboard/SEO friendly, FR-27/NFR-01) and
 * the active rule mirrors scroll position (`aria-current`). Scroll progress is
 * written to a `--rail-p` CSS variable so the spine/node update without React
 * re-renders; the smooth travel runs only under `motion-safe` (reduced-motion →
 * the line still reflects position, just without easing). Desktop-only — the
 * mobile layout keeps the inline `RuleIndex`.
 */
export function ReadingRail({ titleKeys }: ReadingRailProps): React.ReactElement | null {
  const t = useT();
  const rootRef = useRef<HTMLElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = titleKeys
      .map((_, i) => document.getElementById(`rule-${i + 1}`))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    let raf = 0;
    const update = (): void => {
      const first = els[0].getBoundingClientRect();
      const last = els[els.length - 1].getBoundingClientRect();
      const startY = first.top + window.scrollY;
      const endY = last.top + last.height + window.scrollY;
      const mid = window.scrollY + window.innerHeight * 0.5;
      const p = clamp((mid - startY) / (endY - startY || 1), 0, 1);
      root.style.setProperty('--rail-p', p.toFixed(4));

      // Active = last station whose top has crossed ~⅓ of the viewport.
      let act = 0;
      els.forEach((el, i) => {
        if (el.getBoundingClientRect().top <= window.innerHeight * 0.35) act = i;
      });
      if (act !== activeRef.current) {
        activeRef.current = act;
        setActive(act);
      }
    };
    const onScroll = (): void => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [titleKeys]);

  if (titleKeys.length < 2) return null;

  return (
    <nav
      ref={rootRef}
      aria-label={t('rules.onThisPage')}
      className="sticky top-28 hidden self-start lg:block"
    >
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-fg-subtle">
        {t('rules.onThisPage')}
      </p>

      <div className="relative mt-4">
        {/* Spine track (always visible). */}
        <span aria-hidden className="absolute left-2 inset-y-2 w-0.5 rounded-full bg-border" />
        {/* Progress fill — draws downward with scroll. */}
        <span
          aria-hidden
          style={{ transform: 'scaleY(var(--rail-p, 0))', transformOrigin: 'top' }}
          className="absolute left-2 inset-y-2 w-0.5 rounded-full bg-[var(--amber)] motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out"
        />
        {/* Travelling hand-node. */}
        <span
          aria-hidden
          style={{ top: 'calc(0.5rem + var(--rail-p, 0) * (100% - 1rem))' }}
          className="absolute left-0.5 z-10 block h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-[var(--amber)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--amber)_28%,transparent)] motion-safe:transition-[top] motion-safe:duration-200 motion-safe:ease-out"
        />

        <ol className="relative space-y-0.5">
          {titleKeys.map((key, i) => {
            const isActive = i === active;
            return (
              <li key={key}>
                <a
                  href={`#rule-${i + 1}`}
                  aria-current={isActive ? 'true' : undefined}
                  className="group relative flex min-h-touch items-center gap-3 rounded-xl py-2 pl-7 pr-2 text-sm transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span
                    aria-hidden
                    className={
                      isActive
                        ? 'absolute left-[3px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-[var(--amber)] bg-[var(--amber)]'
                        : 'absolute left-[3px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-surface group-hover:border-border-strong'
                    }
                  />
                  <span
                    className={
                      isActive
                        ? 'font-semibold text-fg [text-wrap:balance]'
                        : 'text-fg-muted group-hover:text-fg [text-wrap:balance]'
                    }
                  >
                    {t(key)}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
