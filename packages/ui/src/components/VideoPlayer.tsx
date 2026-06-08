'use client';

import { useEffect, useRef, useState } from 'react';
import { Captions, CaptionsOff } from 'lucide-react';
import { cn } from '../cn';

export interface VideoCaption {
  src: string;
  srcLang: string;
  label: string;
  default?: boolean;
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  /** Accessible name, e.g. the word's lemma + "sign video". */
  label: string;
  captions?: VideoCaption[];
  /** Loop the clip (common for short sign demonstrations). */
  loop?: boolean;
  /** i18n labels for the captions toggle. */
  captionsLabels?: { show: string; hide: string };
  className?: string;
}

/**
 * Video-centric word presentation (deaf-first, §11). NEVER autoplays with sound:
 * the player is muted, never auto-unmutes, and audio carries no required info.
 * If caption tracks are supplied, a keyboard-operable toggle shows/hides them.
 */
export function VideoPlayer({
  src,
  poster,
  label,
  captions = [],
  loop = false,
  captionsLabels = { show: 'Show captions', hide: 'Hide captions' },
  className,
}: VideoPlayerProps): React.ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCaptions = captions.length > 0;
  const [captionsOn, setCaptionsOn] = useState<boolean>(captions.some((c) => c.default));

  // Reflect captionsOn into the native text track mode.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i += 1) {
      tracks[i].mode = captionsOn ? 'showing' : 'hidden';
    }
  }, [captionsOn]);

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-black', className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        muted
        playsInline
        loop={loop}
        preload="metadata"
        aria-label={label}
        className="aspect-video w-full bg-black"
      >
        {captions.map((c) => (
          <track
            key={c.srcLang}
            kind="captions"
            src={c.src}
            srcLang={c.srcLang}
            label={c.label}
            default={c.default}
          />
        ))}
      </video>
      {hasCaptions && (
        <div className="flex justify-end bg-bg p-2">
          <button
            type="button"
            aria-pressed={captionsOn}
            onClick={() => setCaptionsOn((v) => !v)}
            className="inline-flex min-h-touch items-center gap-2 rounded-md px-3 text-sm font-medium text-fg hover:bg-surface-muted"
          >
            {captionsOn ? (
              <CaptionsOff aria-hidden className="h-5 w-5" />
            ) : (
              <Captions aria-hidden className="h-5 w-5" />
            )}
            {captionsOn ? captionsLabels.hide : captionsLabels.show}
          </button>
        </div>
      )}
    </div>
  );
}
