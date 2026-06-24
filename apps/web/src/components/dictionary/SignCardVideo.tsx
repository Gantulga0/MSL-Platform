'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { GestureScene } from '@/components/signs/GestureScene';

export function SignCardVideo({ src }: { src?: string | null }): React.ReactElement {
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
      const card = v.closest('a') ?? v.parentElement;
      if (!card) return;
      card.addEventListener('mouseenter', play);
      card.addEventListener('mouseleave', stop);
      return () => {
        card.removeEventListener('mouseenter', play);
        card.removeEventListener('mouseleave', stop);
      };
    }
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

      <span
        aria-hidden
        className="absolute bottom-3 right-3 z-[3] grid h-10 w-10 place-items-center rounded-full bg-[var(--amber)] text-[#3a2400] shadow-[0_8px_20px_-8px_var(--amber)] transition-transform group-hover:scale-110"
      >
        <Play className="h-4 w-4 translate-x-[1px] fill-current" />
      </span>
    </div>
  );
}
