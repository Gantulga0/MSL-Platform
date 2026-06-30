'use client';

import { useEffect, useRef, useState } from 'react';
import { Hand, Play } from 'lucide-react';
import { cn } from '@msl/ui';
import { useT } from '@/i18n/client';
import type { SignItem } from './types';

export function SignTile({
  item,
  onOpen,
  size = 'lg',
}: {
  item: SignItem;
  onOpen: () => void;
  size?: 'lg' | 'sm';
}): React.ReactElement {
  const t = useT();
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const isImage = item.kind === 'image';
  const showMedia = !failed;

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
    // Autoplay-in-view is a video-only behaviour; images are static.
    if (isImage || !showMedia) return;
    const v = ref.current;
    if (!v) return;

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
  }, [isImage, showMedia]);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={item.ariaLabel}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-lg focus-visible:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-tint-sage to-tint-lav"
        onMouseEnter={() => !isImage && showMedia && play()}
        onMouseLeave={() => !isImage && showMedia && stop()}
      >
        {!showMedia ? (
          <div className="flex flex-col items-center gap-1.5 px-3 text-center text-accent-ink">
            <Hand aria-hidden className="h-8 w-8" />
            <span className="text-[11px] font-semibold leading-tight">{t('signs.comingSoon')}</span>
          </div>
        ) : isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.src}
            alt=""
            aria-hidden
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            ref={ref}
            src={item.src}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        )}

        {/* Play affordance — the sign animates; mirrors the dictionary card cue. */}
        {showMedia && !isImage && (
          <span
            aria-hidden
            className={cn(
              'absolute bottom-2.5 right-2.5 z-[3] grid place-items-center rounded-full bg-[var(--amber)] text-[#3a2400] shadow-[0_8px_20px_-8px_var(--amber)] transition-transform group-hover:scale-110 motion-reduce:transform-none',
              size === 'lg' ? 'h-10 w-10' : 'h-9 w-9',
            )}
          >
            <Play className={cn('translate-x-[1px] fill-current', size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-3 py-3 text-center">
        {size === 'lg' ? (
          <>
            <span className="block font-display text-4xl font-extrabold leading-none text-fg">
              {item.display}
            </span>
            <span className="mt-1.5 block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-fg-subtle">
              {t('signs.sign')}
            </span>
          </>
        ) : (
          <span className="block font-display text-base font-bold leading-tight text-fg">
            {item.display}
          </span>
        )}
      </div>
    </button>
  );
}
