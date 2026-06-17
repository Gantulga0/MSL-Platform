'use client';

import { useEffect, useRef } from 'react';
import { Hand, Play } from 'lucide-react';
import { translate as t } from '@/i18n';
import { GestureScene } from '@/components/signs/GestureScene';

/**
 * The card's sign-video thumbnail. Plays muted/looped/inline on hover (pointer
 * devices) and, on touch devices with no hover, when the card is the one mostly
 * in view (IntersectionObserver). Resets to the first frame when it stops, so
 * only the hovered/visible card ever plays — keeping many-card lists smooth.
 *
 * Overlays (all decorative / `aria-hidden`, the parent card link owns the name):
 * a hand-count chip (top-left), an amber play affordance (bottom-right). When
 * there is no media, a dark "sign stage" with the gesture-trail motif stands in.
 */
export function SignCardVideo({
  src,
  handCount,
}: {
  src?: string | null;
  /** 1 or 2 — drives the hand-count chip. */
  handCount?: number | null;
}): React.ReactElement {
  const ref = useRef<HTMLVideoElement>(null);

  function play(): void {
    const v = ref.current;
    if (v) {
      v.currentTime = 0;
      void v.play().catch(() => {});
    }
  }
  function stop(): void {
    const v = ref.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }

  useEffect(() => {
    const v = ref.current;
    if (!src || !v) return;
    // Pointer devices use the hover handlers; only set up the in-view fallback
    // where hover doesn't exist (touch/mobile).
    const hasHover = window.matchMedia?.('(hover: hover)').matches;
    if (hasHover) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) play();
          else stop();
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [src]);

  const handLabel =
    handCount === 1 ? t('dict.handsOne') : handCount === 2 ? t('dict.handsTwo') : null;

  return (
    <div
      className="relative z-[6] aspect-video overflow-hidden rounded-t-[var(--r)]"
      onMouseEnter={play}
      onMouseLeave={stop}
    >
      {src ? (
        <video
          ref={ref}
          src={src}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="sign-stage relative h-full w-full">
          <GestureScene className="absolute inset-0 h-full w-full" />
        </div>
      )}

      {/* Hand-count chip. */}
      {handLabel && (
        <span className="absolute left-3 top-3 z-[3] inline-flex items-center gap-1.5 rounded-lg bg-surface/80 px-2.5 py-1 text-xs font-bold text-fg backdrop-blur">
          <Hand aria-hidden className="h-3.5 w-3.5" />
          {handLabel}
        </span>
      )}

      {/* Amber play affordance — the card is deaf-first (video, never audio). */}
      <span
        aria-hidden
        className="absolute bottom-3 right-3 z-[3] grid h-10 w-10 place-items-center rounded-full bg-[var(--amber)] text-[#3a2400] shadow-[0_8px_20px_-8px_var(--amber)] transition-transform group-hover:scale-110"
      >
        <Play className="h-4 w-4 translate-x-[1px] fill-current" />
      </span>
    </div>
  );
}
