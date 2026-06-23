'use client';

import { PlayCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { translate as t } from '@/i18n';

export interface RuleSectionProps {
  /** 1-based rule number, also used as the scroll anchor id. */
  index: number;
  /** i18n key for the small "Дүрэм N" eyebrow chip. */
  eyebrowKey?: string;
  /** i18n key for the section heading. */
  titleKey: string;
  /** i18n keys for the body paragraphs, in order. */
  paragraphKeys: string[];
  /** Signed URL of the explanatory video; a shimmering placeholder shows when absent. */
  videoSrc?: string | null;
}

/** The video panel, or an accessible shimmering placeholder until a clip exists. */
function RuleVideo({ src }: { src?: string | null }): React.ReactElement {
  if (src) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black shadow-md">
        <video src={src} controls playsInline preload="metadata" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className="relative flex aspect-video flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border bg-accent-subtle text-accent-ink">
      <span
        aria-hidden
        className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 animate-pulse bg-gradient-to-r from-transparent via-white/50 to-transparent"
      />
      <PlayCircle aria-hidden className="relative h-14 w-14" />
      <span className="relative px-6 text-center text-sm font-medium">{t('rules.videoPlaceholder')}</span>
    </div>
  );
}

/**
 * One rule of a "Дүрэм" reference page: an eyebrow chip + heading + single-column
 * prose at a readable measure, with the explanatory video as a sticky side panel
 * on desktop and a stacked card on mobile. This replaces the old float layout,
 * which left a jagged, hard-to-track measure on long Mongolian text. The card
 * reveals on scroll and honours reduced-motion (NFR-01, WCAG 2.2 AA).
 */
export function RuleSection({
  index,
  eyebrowKey,
  titleKey,
  paragraphKeys,
  videoSrc,
}: RuleSectionProps): React.ReactElement {
  const reduce = useReducedMotion();
  return (
    <motion.section
      id={`rule-${index}`}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="scroll-mt-28 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <div className="lg:flex-1">
          {eyebrowKey && (
            <span className="inline-flex items-center rounded-full bg-accent-subtle px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-ink">
              {t(eyebrowKey)}
            </span>
          )}
          <h2 className="mt-3 text-xl font-bold tracking-tight text-fg sm:text-2xl">{t(titleKey)}</h2>
          <div className="mt-4 max-w-prose space-y-4 text-base leading-relaxed text-fg">
            {paragraphKeys.map((key) => (
              <p key={key}>{t(key)}</p>
            ))}
          </div>
        </div>
        <div className="lg:sticky lg:top-28 lg:w-[42%] lg:flex-shrink-0">
          <RuleVideo src={videoSrc} />
        </div>
      </div>
    </motion.section>
  );
}
