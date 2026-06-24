'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { GestureScene } from '@/components/signs/GestureScene';

/**
 * The card's sign-video thumbnail. Plays muted/looped/inline on hover (pointer
 * devices) and, on touch devices with no hover, when the card is the one mostly
 * in view (IntersectionObserver). Resets to the first frame when it stops, so
 * only the hovered/visible card ever plays — keeping many-card lists smooth.
 *
 * Overlays (all decorative / `aria-hidden`, the parent card link owns the name):
 * an amber play affordance (bottom-right). When there is no media, a dark "sign
 * stage" with the gesture-trail motif stands in.
 */
export function SignCardVideo({
  src,
}: {
  src?: string | null;
}): React.ReactElement {
  const ref = useRef<HTMLVideoElement>(null);

  const play = useCallback((): void => {
    const v = ref.current;
    if (v) {
      v.currentTime = 0;
      void v.play().catch(() => {});
    }
  }, []);
  const stop = useCallback((): void => {
    const v = ref.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!src || !v) return;
    const hasHover = window.matchMedia?.('(hover: hover)').matches;
    if (hasHover) {
      // Pointer devices: start playback as soon as the cursor reaches anywhere on
      // the card (the enclosing link), not just the thumbnail.
      const card = v.closest('a') ?? v.parentElement;
      if (!card) return;
      card.addEventListener('mouseenter', play);
      card.addEventListener('mouseleave', stop);
      return () => {
        card.removeEventListener('mouseenter', play);
        card.removeEventListener('mouseleave', stop);
      };
    }
    // Touch (no hover): play the card that is mostly in view.
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
  }, [src, play, stop]);

  return (
    <div
      className="relative z-[6] aspect-[4/5] overflow-hidden rounded-t-[var(--r)]"
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
