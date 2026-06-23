'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { HolisticLandmarker } from '@mediapipe/tasks-vision';
import { Button } from '@msl/ui';
import { useT } from '@/i18n/client';
import { getHolistic } from '@/lib/games/holistic';
import { resultToVector, hasHands, type HolisticResult } from '@/lib/games/features';
import type { FeatureVector } from '@/lib/games/features';
import {
  loadTemplates,
  checkTarget,
  type TemplateBundle,
} from '@/lib/games/recognizer';

// Сегментчлэлийн тохиргоо (sign-test-тэй ижил).
const MIN_FRAMES = 6;
const MAX_FRAMES = 150;
const EMPTY_TO_END = 8;

// Зөв/буруу хариуг үзүүлэх хугацаа (мс).
const FEEDBACK_MS = 1400;

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15],
  [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];
const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
];

type Phase = 'loading' | 'ready' | 'starting' | 'playing' | 'error';
type Feedback = { kind: 'correct' | 'wrong'; letter: string; nearest?: string } | null;

function pickLetter(letters: string[], exclude?: string): string {
  if (letters.length <= 1) return letters[0] ?? '';
  let next = exclude;
  while (next === exclude) {
    next = letters[Math.floor(Math.random() * letters.length)];
  }
  return next!;
}

export function AlphabetGame(): React.ReactElement {
  const t = useT();
  const [phase, setPhase] = useState<Phase>('loading');
  const [status, setStatus] = useState(t('game.alphabet.loading'));
  const [target, setTarget] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [recording, setRecording] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confidence, setConfidence] = useState(0);

  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const bundleRef = useRef<TemplateBundle | null>(null);
  const lettersRef = useRef<string[]>([]);
  const targetRef = useRef('');
  const thresholdRef = useRef(5);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bufferRef = useRef<FeatureVector[]>([]);
  const emptyCountRef = useRef(0);
  const lastTimeRef = useRef(-1);
  const lockedRef = useRef(false); // хариу үзүүлж байх үед шинэ дохиог түр зогсооно
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  // ---- Эталон ачаалах ----
  useEffect(() => {
    let alive = true;
    loadTemplates()
      .then((bundle) => {
        if (!alive) return;
        bundleRef.current = bundle;
        lettersRef.current = bundle.letters.map((l) => l.letter);
        thresholdRef.current = bundle.threshold;
        setPhase('ready');
        setStatus(t('game.alphabet.ready'));
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setPhase('error');
        setStatus(t('game.alphabet.loadError'));
        console.error(e);
      });
    return () => {
      alive = false;
      stopCamera();
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextLetter = useCallback(() => {
    const letter = pickLetter(lettersRef.current, targetRef.current);
    setTarget(letter);
    targetRef.current = letter;
    setFeedback(null);
    setConfidence(0);
    lockedRef.current = false;
    bufferRef.current = [];
    emptyCountRef.current = 0;
    setRecording(false);
    setStatus(t('game.alphabet.show', { letter }));
  }, [t]);

  // ---- Бичсэн дохиог зорилтот үсэгтэй шалгах ----
  const finalizeGesture = useCallback(
    (seq: FeatureVector[]) => {
      if (seq.length < MIN_FRAMES || lockedRef.current) return;
      const bundle = bundleRef.current;
      const tgt = targetRef.current;
      if (!bundle || !tgt) return;

      const res = checkTarget(seq, bundle, tgt, thresholdRef.current);
      setConfidence(res.confidence);
      setAttempts((a) => a + 1);
      lockedRef.current = true;

      if (res.correct) {
        setScore((s) => s + 1);
        setFeedback({ kind: 'correct', letter: tgt });
        setStatus(t('game.alphabet.correct', { letter: tgt }));
        feedbackTimer.current = setTimeout(nextLetter, FEEDBACK_MS);
      } else {
        setFeedback({ kind: 'wrong', letter: tgt, nearest: res.best?.letter });
        setStatus(t('game.alphabet.tryAgain', { letter: tgt }));
        feedbackTimer.current = setTimeout(() => {
          setFeedback(null);
          lockedRef.current = false;
          setStatus(t('game.alphabet.show', { letter: tgt }));
        }, FEEDBACK_MS);
      }
    },
    [nextLetter, t],
  );

  // ---- Танилтын гол давталт ----
  const loop = useCallback(
    (landmarker: HolisticLandmarker) => {
      const v = camVideoRef.current;
      if (!v) return;

      if (v.currentTime !== lastTimeRef.current && v.readyState >= 2) {
        lastTimeRef.current = v.currentTime;
        const res = landmarker.detectForVideo(
          v,
          performance.now(),
        ) as unknown as HolisticResult;
        drawOverlay(res);

        const vec = resultToVector(res);
        const buf = bufferRef.current;
        const active = !!vec && hasHands(res);

        if (!lockedRef.current) {
          if (active && vec) {
            buf.push(vec);
            emptyCountRef.current = 0;
            if (!recording) setRecording(true);
            if (buf.length >= MAX_FRAMES) {
              finalizeGesture(buf.slice());
              bufferRef.current = [];
              setRecording(false);
            }
          } else if (buf.length > 0) {
            emptyCountRef.current += 1;
            if (emptyCountRef.current >= EMPTY_TO_END) {
              finalizeGesture(buf.slice());
              bufferRef.current = [];
              emptyCountRef.current = 0;
              setRecording(false);
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(() => loop(landmarker));
    },
    // drawOverlay нь зөвхөн canvasRef унших тул тогтвортой — зориудаар орхив.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finalizeGesture, recording],
  );

  // ---- Камер асаах ----
  const startCamera = useCallback(async () => {
    if (!bundleRef.current) return;
    try {
      setPhase('starting');
      setStatus(t('game.alphabet.loadingModel'));
      const landmarker = await getHolistic();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      const v = camVideoRef.current;
      if (!v) return;
      v.srcObject = stream;
      await v.play();

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = v.videoWidth || 640;
        canvas.height = v.videoHeight || 480;
      }

      bufferRef.current = [];
      emptyCountRef.current = 0;
      lastTimeRef.current = -1;
      lockedRef.current = false;

      setPhase('playing');
      setScore(0);
      setAttempts(0);
      nextLetter();
      loop(landmarker);
    } catch (e) {
      setPhase('error');
      setStatus(t('game.alphabet.cameraError'));
      console.error(e);
    }
  }, [loop, nextLetter, t]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    setRecording(false);
  }, []);

  const stopGame = useCallback(() => {
    stopCamera();
    setPhase('ready');
    setStatus(t('game.alphabet.ready'));
    setFeedback(null);
  }, [stopCamera, t]);

  const skip = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    nextLetter();
  }, [nextLetter]);

  // ---- Зураглал ----
  function drawConnections(
    ctx: CanvasRenderingContext2D,
    lm: { x: number; y: number }[],
    conns: [number, number][],
    color: string,
    w: number,
    cw: number,
    ch: number,
  ) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    for (const [a, b] of conns) {
      if (!lm[a] || !lm[b]) continue;
      ctx.beginPath();
      ctx.moveTo(lm[a].x * cw, lm[a].y * ch);
      ctx.lineTo(lm[b].x * cw, lm[b].y * ch);
      ctx.stroke();
    }
  }

  function drawPoints(
    ctx: CanvasRenderingContext2D,
    lm: { x: number; y: number }[],
    color: string,
    r: number,
    cw: number,
    ch: number,
  ) {
    ctx.fillStyle = color;
    for (const p of lm) {
      ctx.beginPath();
      ctx.arc(p.x * cw, p.y * ch, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawOverlay(res: HolisticResult) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    const pose = res.poseLandmarks?.[0];
    if (pose) {
      drawConnections(ctx, pose, POSE_CONNECTIONS, 'rgba(110,138,44,0.7)', 3, cw, ch);
      drawPoints(
        ctx,
        [pose[0], pose[11], pose[12], pose[13], pose[14]].filter(Boolean),
        '#6e8a2c',
        4,
        cw,
        ch,
      );
    }
    const lh = res.leftHandLandmarks?.[0];
    const rh = res.rightHandLandmarks?.[0];
    if (lh?.length) {
      drawConnections(ctx, lh, HAND_CONNECTIONS, 'rgba(21,128,61,0.9)', 3, cw, ch);
      drawPoints(ctx, lh, '#15803d', 3.5, cw, ch);
    }
    if (rh?.length) {
      drawConnections(ctx, rh, HAND_CONNECTIONS, 'rgba(154,91,8,0.9)', 3, cw, ch);
      drawPoints(ctx, rh, '#9a5b08', 3.5, cw, ch);
    }
  }

  const playing = phase === 'playing';

  return (
    <div className="mx-auto max-w-5xl">
      {/* Удирдлага */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        {!playing ? (
          <Button
            size="lg"
            onClick={startCamera}
            disabled={phase === 'loading' || phase === 'starting'}
            loading={phase === 'starting'}
          >
            {t('game.alphabet.start')}
          </Button>
        ) : (
          <>
            <Button size="lg" variant="secondary" onClick={skip}>
              {t('game.alphabet.skip')}
            </Button>
            <Button size="lg" variant="ghost" onClick={stopGame}>
              {t('game.alphabet.stop')}
            </Button>
          </>
        )}
      </div>

      {/* Статус (дэлгэцийн уншигчид зориулсан amьд муж) */}
      <p
        aria-live="polite"
        className="mb-4 text-center text-base font-medium text-fg-muted"
      >
        {status}
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Зорилтот үсэг + оноо */}
        <section
          aria-label={t('game.alphabet.targetLabel')}
          className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8"
        >
          <span className="text-sm font-medium uppercase tracking-wide text-fg-subtle">
            {t('game.alphabet.makeThisSign')}
          </span>
          <div
            className={[
              'my-4 flex h-44 w-44 items-center justify-center rounded-3xl text-8xl font-bold transition-colors',
              feedback?.kind === 'correct'
                ? 'bg-success-subtle text-success'
                : feedback?.kind === 'wrong'
                  ? 'bg-danger-subtle text-danger'
                  : 'bg-primary-subtle text-fg',
            ].join(' ')}
          >
            {target || '—'}
          </div>

          {/* Зөв/буруугийн текст тэмдэглэгээ (өнгөнд бус текстэд тулгуурлана) */}
          <p className="h-6 text-center text-sm font-semibold" aria-live="assertive">
            {feedback?.kind === 'correct' && (
              <span className="text-success">✓ {t('game.alphabet.correctShort')}</span>
            )}
            {feedback?.kind === 'wrong' && (
              <span className="text-danger">✗ {t('game.alphabet.wrongShort')}</span>
            )}
          </p>

          <dl className="mt-4 flex gap-8 text-center">
            <div>
              <dt className="text-xs text-fg-subtle">{t('game.alphabet.score')}</dt>
              <dd className="text-2xl font-bold text-fg">{score}</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-subtle">{t('game.alphabet.attempts')}</dt>
              <dd className="text-2xl font-bold text-fg">{attempts}</dd>
            </div>
          </dl>

          {/* Итгэлийн зурвас */}
          <div className="mt-4 w-full max-w-xs">
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-muted"
              role="progressbar"
              aria-valuenow={Math.round(confidence * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('game.alphabet.confidence')}
            >
              <div
                className="h-full rounded-full bg-accent-strong transition-all"
                style={{ width: `${Math.round(confidence * 100)}%` }}
              />
            </div>
          </div>
        </section>

        {/* Камер */}
        <section
          aria-label={t('game.alphabet.cameraLabel')}
          className="overflow-hidden rounded-2xl border border-border bg-primary"
        >
          <div className="relative aspect-[4/3] w-full">
            {recording && (
              <span className="absolute left-3 top-3 z-10 rounded-full bg-danger px-3 py-1 text-xs font-semibold text-fg-on-primary">
                ● {t('game.alphabet.recording')}
              </span>
            )}
            <video
              ref={camVideoRef}
              playsInline
              muted
              className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
            />
            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/80 p-6 text-center text-sm text-fg-on-primary">
                {t('game.alphabet.cameraIdle')}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Нууцлалын тэмдэглэл */}
      <p className="mt-6 text-center text-xs text-fg-subtle">
        {t('game.alphabet.privacy')}
      </p>
    </div>
  );
}
