'use client';

import { useEffect, useRef, useState } from 'react';
import { Hand } from 'lucide-react';
import { translate as t } from '@/i18n';
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
      className="group block w-full overflow-hidden rounded-xl border border-border bg-surface text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-tint-sage"
        onMouseEnter={() => !isImage && showMedia && play()}
        onMouseLeave={() => !isImage && showMedia && stop()}
      >
        {!showMedia ? (
          <div className="flex flex-col items-center gap-1 px-2 text-center text-accent-ink">
            <Hand aria-hidden className="h-8 w-8" />
            <span className="text-[11px] font-medium leading-tight">{t('signs.comingSoon')}</span>
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
      </div>
      <div className="px-3 py-3 text-center">
        {size === 'lg' ? (
          <>
            <span className="block text-3xl font-bold leading-none text-fg">{item.display}</span>
            <span className="mt-1 block text-xs font-medium text-fg-muted">{t('signs.sign')}</span>
          </>
        ) : (
          <span className="block text-base font-semibold leading-tight text-fg">{item.display}</span>
        )}
      </div>
    </button>
  );
}
