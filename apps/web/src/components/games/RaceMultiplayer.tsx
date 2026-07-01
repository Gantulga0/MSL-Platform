'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useSearchParams } from 'next/navigation';
import type { Socket } from 'socket.io-client';
import { ArrowLeft, Camera, Check, Copy, Crown, Flag, Loader2, Users } from 'lucide-react';
import { Button, cn } from '@msl/ui';
import { useT } from '@/i18n/client';
import { useSignCapture, type SignCapture } from '@/lib/games/useSignCapture';
import { lettersOf } from '@/lib/games/race-words';
import { pickWord } from '@/lib/games/race-words';
import { connectRace, type PublicPlayer, type RoomSnapshot } from '@/lib/games/raceSocket';
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

type Phase = 'form' | 'lobby' | 'countdown' | 'racing' | 'waiting' | 'finished';

const COUNTDOWN_FROM = 3;

export function RaceMultiplayer({ onExit }: { onExit?: () => void } = {}): React.ReactElement {
  const t = useT();
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>('form');
  const [name, setName] = useState('');
  const [codeInput, setCodeInput] = useState((params.get('room') ?? '').toUpperCase());
  const [connecting, setConnecting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [youId, setYouId] = useState('');
  const [liveIndex, setLiveIndex] = useState<Record<string, number>>({});
  const [finishes, setFinishes] = useState<Record<string, { rank: number; timeMs: number | null }>>(
    {},
  );
  const [results, setResults] = useState<PublicPlayer[] | null>(null);
  const [copied, setCopied] = useState(false);

  // Local race state.
  const [word, setWord] = useState('');
  const [myIndex, setMyIndex] = useState(0);
  const [justHit, setJustHit] = useState<number | null>(null);
  const [count, setCount] = useState<number | 'go'>(COUNTDOWN_FROM);
  const [elapsed, setElapsed] = useState(0);

  const letters = useMemo(() => lettersOf(word), [word]);

  const socketRef = useRef<Socket | null>(null);
  const captureRef = useRef<SignCapture | null>(null);
  const phaseRef = useRef<Phase>('form');
  const lettersRef = useRef<string[]>([]);
  const myIndexRef = useRef(0);
  const youIdRef = useRef('');
  const startRef = useRef(0);
  const finishRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beginCountdownRef = useRef<(word: string) => void>(() => {});

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    lettersRef.current = letters;
  }, [letters]);
  useEffect(() => {
    myIndexRef.current = myIndex;
  }, [myIndex]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countTimer.current) clearTimeout(countTimer.current);
  }, []);

  const handleMatch = useCallback(() => {
    if (phaseRef.current !== 'racing') return;
    const at = myIndexRef.current;
    setJustHit(at);
    const next = at + 1;
    myIndexRef.current = next;
    setMyIndex(next);
    socketRef.current?.emit('race:progress', { index: next });
    if (next >= lettersRef.current.length) {
      const total = performance.now() - startRef.current;
      finishRef.current = total;
      clearTimers();
      captureRef.current?.setActive(false);
      captureRef.current?.setTarget(null);
      socketRef.current?.emit('race:finish', { timeMs: Math.round(total) });
      setPhase('waiting');
    } else {
      captureRef.current?.setTarget(lettersRef.current[next]);
    }
  }, [clearTimers]);

  const capture = useSignCapture({ onMatch: handleMatch });
  useEffect(() => {
    captureRef.current = capture;
  });

  useEffect(() => {
    if (justHit === null) return;
    const id = setTimeout(() => setJustHit(null), 500);
    return () => clearTimeout(id);
  }, [justHit]);

  const beginCountdown = useCallback(
    (raceWord: string) => {
      setWord(raceWord);
      setMyIndex(0);
      myIndexRef.current = 0;
      setElapsed(0);
      setLiveIndex({});
      setFinishes({});
      setResults(null);
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
            capture.setTarget(lettersOf(raceWord)[0] ?? null);
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
  useEffect(() => {
    beginCountdownRef.current = beginCountdown;
  });

  const openSocket = useCallback((): Socket => {
    const s = connectRace();
    socketRef.current = s;
    s.on('race:joined', ({ you }: { code: string; you: string }) => {
      setYouId(you);
      youIdRef.current = you;
      setConnecting(false);
      setErrorKey(null);
      setPhase('lobby');
    });
    s.on('race:error', ({ error }: { error: string }) => {
      setConnecting(false);
      setErrorKey(error);
    });
    s.on('race:room', (snap: RoomSnapshot) => {
      setRoom(snap);
      if (snap.state === 'lobby' && phaseRef.current !== 'lobby') setPhase('lobby');
    });
    s.on('race:started', ({ word: w }: { word: string }) => beginCountdownRef.current(w));
    s.on('race:progress', ({ playerId, index }: { playerId: string; index: number }) =>
      setLiveIndex((m) => ({ ...m, [playerId]: index })),
    );
    s.on(
      'race:finished',
      ({ playerId, timeMs, rank }: { playerId: string; timeMs: number | null; rank: number }) =>
        setFinishes((m) => ({ ...m, [playerId]: { rank, timeMs } })),
    );
    s.on('race:results', ({ ranking }: { ranking: PublicPlayer[] }) => {
      setResults(ranking);
      setPhase('finished');
      clearTimers();
      captureRef.current?.setActive(false);
    });
    s.on('connect_error', () => {
      setConnecting(false);
      setErrorKey('connectError');
    });
    return s;
  }, [clearTimers]);

  const createRoom = useCallback(() => {
    setErrorKey(null);
    setConnecting(true);
    const s = socketRef.current ?? openSocket();
    s.emit('race:create', { name });
  }, [name, openSocket]);

  const joinRoom = useCallback(() => {
    const code = codeInput.trim().toUpperCase();
    if (code.length < 4) return;
    setErrorKey(null);
    setConnecting(true);
    const s = socketRef.current ?? openSocket();
    s.emit('race:join', { code, name });
  }, [codeInput, name, openSocket]);

  const startRace = useCallback(() => {
    const available = new Set(capture.letters);
    const w = pickWord('medium', { available });
    socketRef.current?.emit('race:start', { word: w });
  }, [capture.letters]);

  const leaveRoom = useCallback(() => {
    clearTimers();
    capture.stop();
    socketRef.current?.emit('race:leave');
    socketRef.current?.disconnect();
    socketRef.current = null;
    setRoom(null);
    setResults(null);
    setLiveIndex({});
    setFinishes({});
    setPhase('form');
  }, [capture, clearTimers]);

  const copyInvite = useCallback(() => {
    if (!room) return;
    const url = `${window.location.origin}/games/racer?room=${room.code}`;
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [room]);

  // Full teardown on unmount.
  useEffect(
    () => () => {
      clearTimers();
      socketRef.current?.disconnect();
    },
    [clearTimers],
  );

  const isHost = room?.hostId === youId;
  const cameraReady = capture.status === 'active';

  // Player display rows merging snapshot + live progress + finishes.
  const rows = useMemo(() => {
    const list = results ?? room?.players ?? [];
    const wordLen = room?.wordLength || letters.length || 1;
    return list
      .map((p) => {
        const idx = finishes[p.id] ? wordLen : (liveIndex[p.id] ?? p.index);
        return {
          ...p,
          index: idx,
          rank: finishes[p.id]?.rank ?? p.rank,
          timeMs: finishes[p.id]?.timeMs ?? p.timeMs,
          progress: Math.min(1, idx / wordLen),
          isYou: p.id === youId,
        };
      })
      .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || b.progress - a.progress);
  }, [results, room, finishes, liveIndex, letters.length, youId]);

  return (
    <div className="mx-auto max-w-5xl">
      <RaceStage>
        {/* Opponent / player progress rail (during race + results) */}
        {(phase === 'racing' ||
          phase === 'waiting' ||
          phase === 'countdown' ||
          phase === 'finished') &&
          room && (
            <div className="absolute left-3 right-3 top-3 z-20 space-y-1.5 sm:left-5 sm:right-5 sm:top-5">
              {rows.map((p) => (
                <PlayerBar key={p.id} player={p} />
              ))}
            </div>
          )}

        {(phase === 'racing' || phase === 'countdown') && (
          <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-4">
            <p className="mb-5 text-center text-sm font-semibold text-white/70">
              {phase === 'racing' && letters[myIndex]
                ? t('game.race.showLetter', { letter: letters[myIndex] })
                : t('game.race.getReady')}
            </p>
            <WordTrack letters={letters} currentIndex={myIndex} justHit={justHit} />
          </div>
        )}

        {/* The camera <video> stays mounted from the lobby on, so enabling the
            camera always has a target element (it sits hidden behind covers). */}
        {phase !== 'form' && <CameraPip capture={capture} label={t('game.race.yourCamera')} />}
        {(phase === 'racing' || phase === 'countdown' || phase === 'waiting') && (
          <div className="absolute bottom-3 left-3 z-20 sm:bottom-5 sm:left-5">
            <StatPill label={t('game.race.elapsed')} value={formatTime(elapsed)} />
          </div>
        )}

        {phase === 'countdown' && <Countdown value={count} />}

        {/* Camera not enabled when the race starts — let them join late. */}
        {(phase === 'racing' || phase === 'waiting') && !cameraReady && (
          <CameraGate status={capture.status} onEnable={() => void capture.start()}>
            <p className="font-display text-xl font-bold">{t('game.race.enableToRace')}</p>
          </CameraGate>
        )}

        {phase === 'waiting' && cameraReady && (
          <Cover>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-jade/15 text-jade">
              <Flag aria-hidden className="h-7 w-7" />
            </span>
            <p className="font-display text-2xl font-black">{t('game.race.youFinished')}</p>
            <p className="text-3xl font-black tabular-nums text-lime-300">
              {formatTime(finishRef.current)}
            </p>
            <p className="flex items-center gap-2 text-sm text-slate-300">
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              {t('game.race.waitingOthers')}
            </p>
          </Cover>
        )}

        {/* Lobby + join/create form share the cover. */}
        {phase === 'form' && (
          <Cover>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-500/15 text-sky-300">
              <Users aria-hidden className="h-7 w-7" />
            </span>
            <p className="font-display text-2xl font-extrabold">{t('game.race.multiTitle')}</p>
            <p className="text-sm leading-relaxed text-slate-200">{t('game.race.multiLead')}</p>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder={t('game.race.yourName')}
              aria-label={t('game.race.yourName')}
              className="mt-1 h-control-sm w-64 rounded-xl border border-white/20 bg-white/10 px-3.5 text-center text-base text-white placeholder:text-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            />

            <Button size="lg" onClick={createRoom} loading={connecting} className="w-64">
              {t('game.race.createRoom')}
            </Button>

            <div className="flex w-64 items-center gap-2">
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder={t('game.race.roomCode')}
                aria-label={t('game.race.roomCode')}
                className="h-control-sm w-full rounded-xl border border-white/20 bg-white/10 px-3.5 text-center text-base font-bold uppercase tracking-[0.3em] text-white placeholder:tracking-normal placeholder:text-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              />
              <Button variant="secondary" onClick={joinRoom} disabled={codeInput.trim().length < 4}>
                {t('game.race.join')}
              </Button>
            </div>
            {errorKey && (
              <p role="alert" className="text-sm font-semibold text-red-300">
                {t(`game.race.err.${errorKey}`)}
              </p>
            )}
          </Cover>
        )}

        {phase === 'lobby' && room && (
          <Cover>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              {t('game.race.roomCode')}
            </p>
            <div className="flex items-center gap-2">
              <span className="font-display text-4xl font-black tracking-[0.2em] text-white">
                {room.code}
              </span>
              <button
                type="button"
                onClick={copyInvite}
                aria-label={t('game.race.copyInvite')}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                {copied ? (
                  <Check aria-hidden className="h-4 w-4" />
                ) : (
                  <Copy aria-hidden className="h-4 w-4" />
                )}
              </button>
            </div>

            <ul className="mt-2 w-64 space-y-1.5">
              {room.players.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 font-semibold text-white">
                    {p.isHost && <Crown aria-hidden className="h-4 w-4 text-amber-300" />}
                    {p.name}
                    {p.id === youId && (
                      <span className="text-white/50">({t('game.race.you')})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {!cameraReady && (
              <Button variant="secondary" onClick={() => void capture.start()} className="mt-1">
                <Camera aria-hidden className="mr-2 h-4 w-4" />
                {t('game.race.enableCamera')}
              </Button>
            )}
            {cameraReady && (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-jade">
                <Check aria-hidden className="h-4 w-4" />
                {t('game.race.cameraReady')}
              </p>
            )}

            {isHost ? (
              <Button size="lg" onClick={startRace} className="mt-1 w-64">
                {t('game.race.startRace')}
              </Button>
            ) : (
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                {t('game.race.waitingHost')}
              </p>
            )}
          </Cover>
        )}

        {phase === 'finished' && (
          <Cover>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-300/15 text-amber-300">
              <Crown aria-hidden className="h-7 w-7" />
            </span>
            <p className="font-display text-2xl font-black">{t('game.race.results')}</p>
            <ol className="mt-1 w-72 space-y-1.5">
              {rows.map((p, i) => (
                <li
                  key={p.id}
                  className={cn(
                    'flex items-center justify-between rounded-xl border px-3 py-2 text-sm',
                    p.isYou ? 'border-amber-300/50 bg-amber-300/10' : 'border-white/15 bg-white/5',
                  )}
                >
                  <span className="flex items-center gap-2 font-semibold text-white">
                    <span className="tabular-nums text-white/60">{p.rank ?? i + 1}.</span>
                    {p.name}
                    {p.isYou && <span className="text-white/50">({t('game.race.you')})</span>}
                  </span>
                  <span className="tabular-nums text-lime-300">
                    {p.timeMs != null ? formatTime(p.timeMs) : '—'}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              {isHost && (
                <Button size="lg" onClick={startRace}>
                  {t('game.race.raceAgain')}
                </Button>
              )}
              <Button size="lg" variant="secondary" onClick={leaveRoom}>
                {t('game.race.leaveRoom')}
              </Button>
            </div>
          </Cover>
        )}
      </RaceStage>

      <div className="mt-6 flex items-center justify-between gap-4">
        {phase === 'form' ? (
          onExit ? (
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
          )
        ) : (
          <button
            type="button"
            onClick={leaveRoom}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted hover:text-fg"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            {t('game.race.leaveRoom')}
          </button>
        )}
        <p className="text-right text-xs text-fg-subtle">{t('game.race.privacy')}</p>
      </div>
    </div>
  );
}

function PlayerBar({
  player,
}: {
  player: PublicPlayer & { progress: number; isYou: boolean };
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <span className="flex w-20 shrink-0 items-center gap-1 truncate text-xs font-semibold text-white/80">
        {player.isHost && <Crown aria-hidden className="h-3 w-3 shrink-0 text-amber-300" />}
        <span className="truncate">{player.name}</span>
      </span>
      <div className="relative h-6 flex-1">
        <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-200',
              player.isYou ? 'bg-amber-300' : 'bg-sky-400',
            )}
            style={{ width: `${Math.round(player.progress * 100)}%` }}
          />
        </div>
        {/* The racing "car" marker — swaps to /games/racer/car.png when added. */}
        <span
          aria-hidden
          className={cn(
            'racer-car absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full shadow',
            player.isYou ? 'bg-amber-300' : 'bg-sky-400',
          )}
          style={{ left: `${Math.round(player.progress * 100)}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums text-white/70">
        {player.finished ? `#${player.rank}` : `${Math.round(player.progress * 100)}%`}
      </span>
    </div>
  );
}
