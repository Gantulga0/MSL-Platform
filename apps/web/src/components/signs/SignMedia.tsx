'use client';

import { useState } from 'react';
import { Hand } from 'lucide-react';
import { translate as t } from '@/i18n';

export function SignMedia({
  src,
  label,
  kind = 'video',
}: {
  src: string;
  label: string;
  kind?: 'image' | 'video';
}): React.ReactElement {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-tint-sage text-accent-ink">
        <Hand aria-hidden className="h-12 w-12" />
        <span className="text-sm font-medium">{t('signs.comingSoon')}</span>
      </div>
    );
  }

  if (kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={label}
        onError={() => setFailed(true)}
        className="max-h-[60vh] w-full rounded-lg border border-border bg-surface object-contain"
      />
    );
  }

  return (
    <video
      src={src}
      aria-label={label}
      controls
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
      className="aspect-video w-full rounded-lg border border-border bg-black"
    />
  );
}
