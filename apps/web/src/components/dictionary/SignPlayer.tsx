'use client';

import { useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useT } from '@/i18n/client';
import { GestureScene } from '@/components/signs/GestureScene';

const RATES = [0.5, 1] as const;

export function SignPlayer({
  src,
  poster,
  label,
  region,
}: {
  src?: string | null;
  poster?: string;
  label: string;
  region?: string | null;
}): React.ReactElement {
  const t = useT();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rateIdx, setRateIdx] = useState(0);

  function toggle(): void {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  }

  function onTime(): void {
    const v = ref.current;
    if (v && v.duration > 0) setProgress((v.currentTime / v.duration) * 100);
  }

  function seek(value: number): void {
    const v = ref.current;
    if (v && v.duration > 0) v.currentTime = (value / 100) * v.duration;
    setProgress(value);
  }

  function cycleRate(): void {
    const next = (rateIdx + 1) % RATES.length;
    setRateIdx(next);
    if (ref.current) ref.current.playbackRate = RATES[next];
  }

  return (
    <div className="sign-stage relative min-h-[320px] overflow-hidden rounded-[var(--r)] sm:min-h-[380px]">
      {region && (
        <span className="absolute left-4 top-4 z-[4] rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
          {region}
        </span>
      )}

      {src ? (
        <video
          ref={ref}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={label}
          className="absolute inset-0 h-full w-full object-contain"
          onPlay={() => {
            setPlaying(true);
            if (ref.current) ref.current.playbackRate = RATES[rateIdx];
          }}
          onPause={() => setPlaying(false)}
          onTimeUpdate={onTime}
        />
      ) : (
        <GestureScene className="absolute inset-0 h-full w-full" />
      )}

      {src && (
        <div className="absolute inset-x-4 bottom-4 z-[4] flex items-center gap-3 rounded-2xl border border-white/15 bg-[rgba(10,11,40,.45)] px-3 py-2.5 backdrop-blur">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? t('dict.pause') : t('dict.play')}
            className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[var(--amber)] text-[#3a2400]"
          >
            {playing ? (
              <Pause aria-hidden className="h-4 w-4 fill-current" />
            ) : (
              <Play aria-hidden className="h-4 w-4 translate-x-[1px] fill-current" />
            )}
          </button>

          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label={label}
            className="h-1.5 flex-1 cursor-pointer accent-[var(--amber)]"
          />

          <button
            type="button"
            onClick={cycleRate}
            aria-label={t('dict.speed')}
            className="flex-none rounded-lg px-2 py-1 text-sm font-bold text-white/90 hover:bg-white/10"
          >
            {RATES[rateIdx]}×
          </button>
        </div>
      )}
    </div>
  );
}
