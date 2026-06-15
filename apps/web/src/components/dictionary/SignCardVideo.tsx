'use client';

import { useEffect, useRef } from 'react';
import { ArrowUpRight, Hand } from 'lucide-react';
import { translate as t } from '@/i18n';

/**
 * The card's sign-video thumbnail. Plays muted/looped/inline on hover (pointer
 * devices) and, on touch devices with no hover, when the card is the one mostly
 * in view (IntersectionObserver). Resets to the first frame when it stops, so
 * only the hovered/visible card ever plays — keeping many-card lists smooth.
 */
export function SignCardVideo({ src }: { src?: string | null }): React.ReactElement {
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

  return (
    <div
      className="relative aspect-video overflow-hidden rounded-t-xl bg-tint-sage"
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
          preload="metadata"
          aria-hidden
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Hand aria-hidden className="h-10 w-10 text-accent-ink/70" />
        </div>
      )}
      <span className="absolute bottom-2 left-2 rounded-full bg-surface/85 px-2 py-0.5 text-xs font-medium text-fg-muted">
        {t('dict.video')}
      </span>
      <span
        aria-hidden
        className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/85 text-fg transition-colors group-hover:bg-primary group-hover:text-fg-on-primary"
      >
        <ArrowUpRight className="h-5 w-5" />
      </span>
    </div>
  );
}
