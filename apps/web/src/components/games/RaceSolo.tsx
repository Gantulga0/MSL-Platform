'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft, RotateCcw, Timer, Trophy, Zap } from 'lucide-react';
import { Button, cn } from '@msl/ui';
import { useT } from '@/i18n/client';
import { useSignCapture, type SignCapture } from '@/lib/games/useSignCapture';
import { lettersOf, pickWord, TIERS, type WordTier } from '@/lib/games/race-words';
import {
  CameraGate,
  CameraPip,
  Countdown,
  Cover,
  formatTime,
  RaceStage,
  StatPill,
  WordTrack,
} from './RaceShared';

type Phase = 'intro' | 'countdown' | 'racing' | 'finished';

const COUNTDOWN_FROM = 3;

function bestKey(tier: WordTier): string {
  return `msl.race.solo.best.${tier}`;
}

export function RaceSolo({ onExit }: { onExit?: () => void } = {}): React.ReactElement {
  const t = useT();
  const [phase, setPhase] = useState<Phase>('intro');
  const [tier, setTier] = useState<WordTier>('easy');
  const [word, setWord] = useState('');
  const [index, setIndex] = useState(0);
  const [justHit, setJustHit] = useState<number | null>(null);
  const [count, setCount] = useState<number | 'go'>(COUNTDOWN_FROM);
  const [elapsed, setElapsed] = useState(0);
  const [best, setBest] = useState<number | null>(null);

  const letters = useMemo(() => lettersOf(word), [word]);
  const lettersRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const phaseRef = useRef<Phase>('intro');
  const tierRef = useRef<WordTier>('easy');
  const startRef = useRef(0);
  const finishRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Lets the pre-capture callbacks reach the capture controller without a
  // use-before-define cycle (capture's onMatch is one of those callbacks).
  const captureRef = useRef<SignCapture | null>(null);

  useEffect(() => {
    lettersRef.current = letters;
  }, [letters]);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    tierRef.current = tier;
  }, [tier]);

  const finishRace = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const total = performance.now() - startRef.current;
    finishRef.current = total;
    setElapsed(total);
    captureRef.current?.setActive(false);
    captureRef.current?.setTarget(null);
    setPhase('finished');
    // Persist a per-tier best time locally (no scores table exists server-side).
    try {
      const prev = Number(localStorage.getItem(bestKey(tierRef.current)));
      if (!prev || total < prev) {
        localStorage.setItem(bestKey(tierRef.current), String(Math.round(total)));
        setBest(Math.round(total));
      } else {
        setBest(prev);
      }
    } catch {
      /* localStorage unavailable — skip persistence */
    }
  }, []);

  const handleMatch = useCallback(() => {
    if (phaseRef.current !== 'racing') return;
    const at = indexRef.current;
    setJustHit(at);
    const next = at + 1;
    indexRef.current = next;
    setIndex(next);
    if (next >= lettersRef.current.length) {
      finishRace();
    } else {
      captureRef.current?.setTarget(lettersRef.current[next]);
    }
  }, [finishRace]);

  const capture = useSignCapture({ onMatch: handleMatch });
  useEffect(() => {
    captureRef.current = capture;
  });

  // Clear the per-slot success flash shortly after it fires.
  useEffect(() => {
    if (justHit === null) return;
    const id = setTimeout(() => setJustHit(null), 500);
    return () => clearTimeout(id);
  }, [justHit]);

  const beginCountdown = useCallback(
    (nextWord: string) => {
      setWord(nextWord);
      setIndex(0);
      indexRef.current = 0;
      setElapsed(0);
      setPhase('countdown');
      capture.setActive(false);
      capture.setTarget(null);

      let n = COUNTDOWN_FROM;
      setCount(n);
      const tick = (): void => {
        n -= 1;
        if (n > 0) {
          setCount(n);
          countTimer.current = setTimeout(tick, 1000);
        } else {
          setCount('go');
          countTimer.current = setTimeout(() => {
            setPhase('racing');
            startRef.current = performance.now();
            capture.setActive(true);
            capture.setTarget(lettersOf(nextWord)[0] ?? null);
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
              setElapsed(performance.now() - startRef.current);
            }, 100);
          }, 650);
        }
      };
      countTimer.current = setTimeout(tick, 1000);
    },
    [capture],
  );

  // Once the camera turns active from the intro gate, drop into the countdown.
  useEffect(() => {
    if (capture.status === 'active' && phaseRef.current === 'intro') {
      beginCountdown(pickWord(tier, { available: new Set(capture.letters) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture.status]);

  // Load the stored best for the chosen tier (intro screen).
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(bestKey(tier)));
      setBest(v > 0 ? v : null);
    } catch {
      setBest(null);
    }
  }, [tier]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countTimer.current) clearTimeout(countTimer.current);
    },
    [],
  );

  const onEnable = useCallback(() => {
    void capture.start();
  }, [capture]);

  const playAgain = useCallback(
    (sameWord: boolean) => {
      const next = sameWord
        ? word
        : pickWord(tier, { exclude: word, available: new Set(capture.letters) });
      beginCountdown(next);
    },
    [beginCountdown, capture.letters, tier, word],
  );

  const stopGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countTimer.current) clearTimeout(countTimer.current);
    capture.stop();
    setPhase('intro');
    setWord('');
    setIndex(0);
  }, [capture]);

  const spm = finishRef.current > 0 ? Math.round((letters.length / finishRef.current) * 60000) : 0;
  const isNewBest = best !== null && Math.round(finishRef.current) <= best && phase === 'finished';

  return (
    <div className="mx-auto max-w-5xl">
      <RaceStage>
        {(phase === 'racing' || phase === 'countdown') && (
          <div className="absolute left-3 right-3 top-3 z-20 flex flex-wrap items-center justify-between gap-2 sm:left-5 sm:right-5 sm:top-5">
            <StatPill label={t('game.race.elapsed')} value={formatTime(elapsed)} />
            <StatPill label={t('game.race.completed')} value={`${index}/${letters.length}`} />
          </div>
        )}

        {(phase === 'racing' || phase === 'countdown') && (
          <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-4">
            <p className="mb-5 text-center text-sm font-semibold text-white/70">
              {phase === 'racing' && letters[index]
                ? t('game.race.showLetter', { letter: letters[index] })
                : t('game.race.getReady')}
            </p>
            <WordTrack letters={letters} currentIndex={index} justHit={justHit} />
          </div>
        )}

        {/* Mounted in every phase so enabling the camera from the intro always
            has a <video> target (it hides behind the intro/results covers). */}
        <CameraPip capture={capture} label={t('game.race.yourCamera')} />

        {phase === 'racing' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={stopGame}
            className="absolute bottom-3 left-3 z-20 border border-white/15 bg-slate-950/60 text-white hover:bg-slate-900 sm:bottom-5 sm:left-5"
          >
            {t('game.race.stop')}
          </Button>
        )}

        {phase === 'countdown' && <Countdown value={count} />}

        {phase === 'intro' && (
          <CameraGate status={capture.status} onEnable={onEnable}>
            <p className="font-display text-2xl font-extrabold">{t('game.race.soloTitle')}</p>
            <p className="text-sm leading-relaxed text-slate-200">{t('game.race.soloLead')}</p>
            <TierPicker tier={tier} onChange={setTier} disabled={capture.status === 'requesting'} />
            {best !== null && (
              <p className="text-xs text-slate-300">
                {t('game.race.bestTime')}:{' '}
                <span className="font-bold text-lime-300">{formatTime(best)}</span>
              </p>
            )}
          </CameraGate>
        )}

        {phase === 'finished' && (
          <Cover>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-300/15 text-amber-300">
              <Trophy aria-hidden className="h-7 w-7" />
            </span>
            <p className="font-display text-2xl font-black">{t('game.race.finished')}</p>
            <p className="font-display text-3xl font-black text-lime-300">{word}</p>
            {isNewBest && (
              <span className="rounded-full bg-amber-300/20 px-3 py-1 text-xs font-bold text-amber-200">
                {t('game.race.newBest')}
              </span>
            )}
            <div className="mt-2 grid w-full grid-cols-3 gap-2 text-left">
              <ResultStat
                icon={<Timer className="h-4 w-4" />}
                label={t('game.race.time')}
                value={formatTime(finishRef.current)}
              />
              <ResultStat
                icon={<Zap className="h-4 w-4" />}
                label={t('game.race.spm')}
                value={String(spm)}
              />
              <ResultStat
                icon={<Trophy className="h-4 w-4" />}
                label={t('game.race.bestTime')}
                value={best !== null ? formatTime(best) : '—'}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={() => playAgain(false)}>
                <RotateCcw aria-hidden className="mr-2 h-4 w-4" />
                {t('game.race.nextWord')}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => playAgain(true)}>
                {t('game.race.retryWord')}
              </Button>
            </div>
            <button
              type="button"
              onClick={stopGame}
              className="mt-2 text-sm font-semibold text-slate-300 underline-offset-2 hover:underline"
            >
              {t('game.race.changeWord')}
            </button>
          </Cover>
        )}
      </RaceStage>

      <div className="mt-6 flex items-center justify-between gap-4">
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted hover:text-fg"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            {t('game.race.changeMode')}
          </button>
        ) : (
          <Link
            href={'/games' as Route}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted hover:text-fg"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            {t('game.race.backToGames')}
          </Link>
        )}
        <p className="text-right text-xs text-fg-subtle">{t('game.race.privacy')}</p>
      </div>
    </div>
  );
}

function TierPicker({
  tier,
  onChange,
  disabled,
}: {
  tier: WordTier;
  onChange: (tier: WordTier) => void;
  disabled?: boolean;
}): React.ReactElement {
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t('game.race.chooseTier')}
      className="inline-flex rounded-full bg-white/10 p-1"
    >
      {TIERS.map((tr) => {
        const active = tr === tier;
        return (
          <button
            key={tr}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(tr)}
            className={cn(
              'min-h-touch rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-50',
              active ? 'bg-white text-slate-900' : 'text-white/70 hover:text-white',
            )}
          >
            {t(`game.race.tier.${tr}`)}
          </button>
        );
      })}
    </div>
  );
}

function ResultStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="rounded-xl bg-white/10 p-3 text-center">
      <dt className="flex items-center justify-center gap-1 text-xs text-white/65">
        <span aria-hidden>{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 font-display text-xl font-black tabular-nums">{value}</dd>
    </div>
  );
}
