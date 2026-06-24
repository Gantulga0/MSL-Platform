'use client';

import { PlayCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useT } from '@/i18n/client';

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

/**
 * The dominant video for a rule, or an accessible placeholder until a clip
 * exists. Rendered large and full-width — the video is the lead element of each
 * rule, since a sign is shown, not told. `label` gives the frame a text
 * alternative (NFR-01); the shimmer is gated behind `motion-safe`.
 */
function RuleVideo({ src, label }: { src?: string | null; label: string }): React.ReactElement {
  const t = useT();
  if (src) {
    return (
      <div className="sign-stage relative aspect-video overflow-hidden rounded-2xl border border-border shadow-md">
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          aria-label={label}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={`${label} — ${t('rules.videoPlaceholder')}`}
      className="sign-stage relative flex aspect-video flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border text-white"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent motion-safe:animate-pulse"
      />
      <PlayCircle aria-hidden className="relative h-16 w-16 text-white/80" />
      <span className="relative px-6 text-center text-sm font-medium text-white/80">
        {t('rules.videoPlaceholder')}
      </span>
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
  const t = useT();
  const reduce = useReducedMotion();
  return (
    <motion.section
      id={`rule-${index}`}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="scroll-mt-28"
    >
      {/* Video — the dominant element of each rule. */}
      <RuleVideo src={videoSrc} label={t(titleKey)} />

      {/* Number + kicker lockup. The script numeral (Pacifico) is a decorative
          tie-in to the reading-rail spine; the chip carries the labelled text. */}
      <div className="mt-6 flex items-center gap-3">
        <span
          aria-hidden
          className="font-[family-name:var(--font-pacifico)] text-4xl leading-none text-[var(--amber-deep)]"
        >
          {index}
        </span>
        {eyebrowKey && (
          <span className="inline-flex items-center rounded-full bg-accent-subtle px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-ink">
            {t(eyebrowKey)}
          </span>
        )}
      </div>

      <h2 className="mt-4 text-balance font-display text-2xl font-bold tracking-tight text-fg sm:text-[1.75rem]">
        {t(titleKey)}
      </h2>
      <div className="mt-4 max-w-2xl space-y-4 text-[1.0625rem] leading-relaxed text-fg [hyphens:auto] [overflow-wrap:anywhere]">
        {paragraphKeys.map((key) => (
          <p key={key}>{t(key)}</p>
        ))}
      </div>
    </motion.section>
  );
}
