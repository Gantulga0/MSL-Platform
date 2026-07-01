'use client';

import { Camera, CameraOff, Check, Loader2, ShieldAlert } from 'lucide-react';
import { Button, cn } from '@msl/ui';
import { useT } from '@/i18n/client';
import type { CaptureStatus, SignCapture } from '@/lib/games/useSignCapture';

/** Dark racer stage (`.racer-game-stage` — swappable background art). */
export function RaceStage({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <section className="overflow-hidden rounded-2xl border border-sky-900/50 bg-slate-950 shadow-xl">
      <div className="racer-game-stage relative min-h-[520px] overflow-hidden sm:min-h-[600px]">
        {children}
      </div>
    </section>
  );
}

/** The word being raced, shown as letter slots (TypeRacer-style). */
export function WordTrack({
  letters,
  currentIndex,
  justHit,
}: {
  letters: string[];
  currentIndex: number;
  /** Index that just advanced — flashes a success state (reduced-motion safe). */
  justHit?: number | null;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {letters.map((letter, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <span
            key={i}
            className={cn(
              'relative grid h-12 w-11 place-items-center rounded-xl border font-display text-2xl font-extrabold transition-colors sm:h-16 sm:w-14 sm:text-3xl',
              done && 'border-jade/50 bg-jade/15 text-jade',
              active &&
                'border-amber-300 bg-amber-300/15 text-white shadow-[0_0_24px_-6px_var(--amber)] race-slot-active',
              !done && !active && 'border-white/15 bg-white/5 text-white/45',
              justHit === i && 'race-slot-hit',
            )}
            aria-current={active ? 'true' : undefined}
          >
            {letter}
            {done && (
              <Check
                aria-hidden
                className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-jade p-0.5 text-slate-950"
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

/** Small picture-in-picture webcam with the landmark overlay + recording dot. */
export function CameraPip({
  capture,
  label,
}: {
  capture: SignCapture;
  label: string;
}): React.ReactElement {
  return (
    <section
      aria-label={label}
      className="absolute bottom-3 right-3 z-20 w-36 overflow-hidden rounded-xl border border-white/20 bg-slate-950 shadow-2xl sm:bottom-5 sm:right-5 sm:w-52"
    >
      <div className="relative aspect-[4/3] w-full">
        {capture.recording && (
          <span className="absolute left-2 top-2 z-10 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
        )}
        <video
          ref={capture.videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        <canvas
          ref={capture.canvasRef}
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        {capture.status !== 'active' && <div className="absolute inset-0 bg-slate-950/80" />}
      </div>
    </section>
  );
}

/** Big pre-race countdown (3 · 2 · 1 · Go). Pulse respects reduced-motion. */
export function Countdown({ value }: { value: number | 'go' }): React.ReactElement {
  const t = useT();
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-slate-950/55 backdrop-blur-sm">
      <span
        key={String(value)}
        className="race-countdown font-display text-7xl font-black text-white sm:text-8xl"
        aria-live="assertive"
      >
        {value === 'go' ? t('game.race.go') : value}
      </span>
    </div>
  );
}

/** A labelled stat chip for the HUD / results. */
export function StatPill({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="rounded-full border border-white/15 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur">
      {label}: <span className="text-lime-300">{value}</span>
    </div>
  );
}

/**
 * Camera-permission cover. Handles the full lifecycle visually (never a blank
 * video): loading templates, an explicit enable prompt, and friendly
 * denied / no-camera / error fallbacks with a retry.
 */
export function CameraGate({
  status,
  onEnable,
  children,
}: {
  status: CaptureStatus;
  onEnable: () => void;
  /** Optional intro content (e.g. how-to) shown above the enable button. */
  children?: React.ReactNode;
}): React.ReactElement {
  const t = useT();

  if (status === 'denied' || status === 'nocam' || status === 'error') {
    const Icon = status === 'nocam' ? CameraOff : ShieldAlert;
    const title =
      status === 'denied'
        ? t('game.race.cameraDenied')
        : status === 'nocam'
          ? t('game.race.cameraNocam')
          : t('game.race.cameraError');
    return (
      <Cover>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15 text-red-300">
          <Icon aria-hidden className="h-7 w-7" />
        </span>
        <p className="text-lg font-bold">{title}</p>
        <p className="max-w-sm text-sm leading-relaxed text-slate-300">
          {t('game.race.cameraHelp')}
        </p>
        {status !== 'nocam' && (
          <Button size="lg" onClick={onEnable} className="mt-2">
            <Camera aria-hidden className="mr-2 h-4 w-4" />
            {t('game.race.tryAgain')}
          </Button>
        )}
      </Cover>
    );
  }

  const busy = status === 'loading' || status === 'requesting';
  return (
    <Cover>
      {children}
      <Button
        size="lg"
        onClick={onEnable}
        disabled={busy}
        loading={status === 'requesting'}
        className="mt-2"
      >
        {status === 'loading' ? (
          <>
            <Loader2 aria-hidden className="mr-2 h-4 w-4 animate-spin" />
            {t('game.race.loadingTemplates')}
          </>
        ) : (
          <>
            <Camera aria-hidden className="mr-2 h-4 w-4" />
            {t('game.race.enableCamera')}
          </>
        )}
      </Button>
    </Cover>
  );
}

/** Shared centered cover panel used by gate/results screens. */
export function Cover({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-slate-950/72 p-5 text-center text-white backdrop-blur-sm">
      <div className="flex max-w-md flex-col items-center gap-3">{children}</div>
    </div>
  );
}

/** mm:ss.t formatting for race timers. */
export function formatTime(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${tenths}`;
}
