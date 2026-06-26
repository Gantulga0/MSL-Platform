'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnimationEvent, CSSProperties } from 'react';
import type { HolisticLandmarker } from '@mediapipe/tasks-vision';
import Image from 'next/image';
import { RotateCcw } from 'lucide-react';
import { Button } from '@msl/ui';
import { useT } from '@/i18n/client';
import { getHolistic } from '@/lib/games/holistic';
import { resultToVector, hasHands, type HolisticResult } from '@/lib/games/features';
import type { FeatureVector } from '@/lib/games/features';
import { loadTemplates, checkTarget, type TemplateBundle } from '@/lib/games/recognizer';

const MIN_FRAMES = 6;
const MAX_FRAMES = 150;
const EMPTY_TO_END = 8;
const FEEDBACK_MS = 760;
const MAX_MISSES = 3;
const WRONG_PENALTY = 50;
const FRUIT_SIZE = 112;

const LEVELS = [
  { number: 1, minScore: 0, letterLimit: 5, speed: 0.72, nameKey: 'game.alphabet.level1' },
  { number: 2, minScore: 600, letterLimit: 15, speed: 0.9, nameKey: 'game.alphabet.level2' },
  {
    number: 3,
    minScore: 1400,
    letterLimit: Number.POSITIVE_INFINITY,
    speed: 1.08,
    nameKey: 'game.alphabet.level3',
  },
] as const;

const FRUITS = [
  {
    id: 'apple',
    label: 'Apple',
    wholeImage: '/games/fruits/apple-1.png',
    slicedImage: '/games/fruits/apple-2.png',
  },
  {
    id: 'banana',
    label: 'Banana',
    wholeImage: '/games/fruits/banana-1.png',
    slicedImage: '/games/fruits/banana-2.png',
  },
  {
    id: 'strawberry',
    label: 'Strawberry',
    wholeImage: '/games/fruits/strawberry-1.png',
    slicedImage: '/games/fruits/strawberry-2.png',
  },
] as const;

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];
const POSE_CONNECTIONS: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
];

type Phase = 'loading' | 'ready' | 'starting' | 'playing' | 'gameover' | 'error';
type Feedback =
  | { kind: 'correct'; letter: string; points: number }
  | { kind: 'wrong'; letter: string; nearest?: string }
  | { kind: 'miss'; letter: string }
  | null;
type Level = (typeof LEVELS)[number];
type StageSize = { width: number; height: number };
type FruitStatus = 'flying' | 'sliced' | 'missed';
type FruitState = {
  id: number;
  letter: string;
  fruitIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  rotation: number;
  rotationSpeed: number;
  spawnedAt: number;
  size: number;
  hasEnteredBounds: boolean;
  hasMissed: boolean;
  isResolved: boolean;
  status: FruitStatus;
};
type FloatingText = {
  id: number;
  x: number;
  y: number;
  text: string;
  kind: 'bonus' | 'penalty' | 'miss';
};

type FruitStyle = CSSProperties & {
  '--fruit-x': string;
  '--fruit-y': string;
  '--fruit-rotation': string;
};

function getLevel(score: number) {
  return [...LEVELS].reverse().find((level) => score >= level.minScore) ?? LEVELS[0];
}

function calculateScoreBonus(elapsedMs: number): number {
  const elapsedSeconds = elapsedMs / 1000;
  if (elapsedSeconds <= 1) return 150;
  if (elapsedSeconds <= 2) return 130;
  return 100;
}

function pickLetter(letters: string[], exclude?: string): string {
  if (letters.length <= 1) return letters[0] ?? '';
  let next = exclude;
  while (next === exclude) {
    next = letters[Math.floor(Math.random() * letters.length)];
  }
  return next!;
}

function spawnFruit(
  id: number,
  letter: string,
  fruitIndex: number,
  level: Level,
  stage: StageSize,
): FruitState {
  const direction = id % 5;
  const speed = level.speed;

  const centerX = stage.width / 2;
  const centerY = stage.height / 2;

  // Side spawn-ууд арай доороос эхэлнэ. Ингэснээр дээшээ шидэгдэж байгаа мэт харагдана.
  const sideY = stage.height * (0.6 + Math.random() * 0.22);

  // Bottom spawn random x
  const bottomX = stage.width * (0.2 + Math.random() * 0.6);

  // Level 1 дээр horizontal speed удаан байна.
  const randomVx = (Math.random() - 0.5) * 120 * speed;

  const presets = [
    // Доороос дээш
    {
      x: bottomX,
      y: stage.height + FRUIT_SIZE,
      vx: randomVx,
      vy: -780 * speed,
    },

    // Зүүн талаас орж ирээд дээш явах
    {
      x: -FRUIT_SIZE,
      y: sideY,
      vx: 300 * speed,
      vy: -450 * speed,
    },

    // Баруун талаас орж ирээд дээш явах
    {
      x: stage.width + FRUIT_SIZE,
      y: sideY,
      vx: -300 * speed,
      vy: -450 * speed,
    },

    // Зүүн доороос диагональ дээш
    {
      x: -FRUIT_SIZE,
      y: stage.height + FRUIT_SIZE * 0.7,
      vx: 240 * speed,
      vy: -660 * speed,
    },

    // Баруун доороос диагональ дээш
    {
      x: stage.width + FRUIT_SIZE,
      y: stage.height + FRUIT_SIZE * 0.7,
      vx: -240 * speed,
      vy: -680 * speed,
    },
  ];

  const preset = presets[direction] ?? {
    x: centerX,
    y: centerY,
    vx: randomVx,
    vy: -650 * speed,
  };

  return {
    id,
    letter,
    fruitIndex,
    x: preset.x,
    y: preset.y,
    vx: preset.vx,
    vy: preset.vy,

    // Өмнөх 720 нь хэт хурдан унагаж байсан. 420 бол илүү floaty.
    gravity: 420 * speed,

    rotation: Math.floor(Math.random() * 80) - 40,

    // Rotation бас хэт хурдан байсан тул багасгав.
    rotationSpeed: (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 90) * speed,

    spawnedAt: performance.now(),
    size: FRUIT_SIZE,
    hasEnteredBounds: false,
    hasMissed: false,
    isResolved: false,
    status: 'flying',
  };
}

function isFruitInsideBounds(fruit: FruitState, stage: StageSize): boolean {
  const radius = fruit.size / 2;
  return (
    fruit.x + radius >= 0 &&
    fruit.x - radius <= stage.width &&
    fruit.y + radius >= 0 &&
    fruit.y - radius <= stage.height
  );
}

function isFruitOutOfBounds(fruit: FruitState, stage: StageSize): boolean {
  const margin = fruit.size / 2;
  return (
    fruit.x < -margin ||
    fruit.x > stage.width + margin ||
    fruit.y < -margin ||
    fruit.y > stage.height + margin
  );
}

function toFruitStyle(fruit?: FruitState | null): FruitStyle {
  return {
    '--fruit-x': `${fruit?.x ?? 0}px`,
    '--fruit-y': `${fruit?.y ?? 0}px`,
    '--fruit-rotation': `${fruit?.rotation ?? 0}deg`,
  };
}

function applyFruitTransform(element: HTMLDivElement | null, fruit: FruitState) {
  if (!element) return;
  element.style.setProperty('--fruit-x', `${fruit.x}px`);
  element.style.setProperty('--fruit-y', `${fruit.y}px`);
  element.style.setProperty('--fruit-rotation', `${fruit.rotation}deg`);
}

function MissXIcon({ active }: { active: boolean }): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className={[
        'h-8 w-8 transition-transform',
        active ? 'alphabet-miss-x-active text-red-500' : 'text-white/25',
      ].join(' ')}
    >
      <path
        d="M8 8L24 24M24 8L8 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="6"
      />
    </svg>
  );
}

export function AlphabetGame(): React.ReactElement {
  const t = useT();
  const [phase, setPhase] = useState<Phase>('loading');
  const [status, setStatus] = useState(t('game.alphabet.loading'));
  const [fruit, setFruit] = useState<FruitState | null>(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [slices, setSlices] = useState(0);
  const [recording, setRecording] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confidence, setConfidence] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fruitElementRef = useRef<HTMLDivElement | null>(null);

  const bundleRef = useRef<TemplateBundle | null>(null);
  const allLettersRef = useRef<string[]>([]);
  const targetRef = useRef('');
  const scoreRef = useRef(0);
  const missesRef = useRef(0);
  const wrongAttemptsRef = useRef(0);
  const slicesRef = useRef(0);
  const attemptsRef = useRef(0);
  const fruitRef = useRef<FruitState | null>(null);
  const fruitIdRef = useRef(0);
  const floatingIdRef = useRef(0);
  const thresholdRef = useRef(5);
  const rafRef = useRef<number | null>(null);
  const physicsRafRef = useRef<number | null>(null);
  const lastPhysicsTimeRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bufferRef = useRef<FeatureVector[]>([]);
  const emptyCountRef = useRef(0);
  const lastTimeRef = useRef(-1);
  const lockedRef = useRef(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playing = phase === 'playing';
  const level = useMemo(() => getLevel(score), [score]);
  const accuracy = attempts > 0 ? Math.round((slices / attempts) * 100) : 0;

  useEffect(() => {
    fruitRef.current = fruit;
    targetRef.current = fruit?.letter ?? '';
    if (fruit) applyFruitTransform(fruitElementRef.current, fruit);
  }, [fruit]);

  useEffect(() => {
    for (const item of FRUITS) {
      const whole = new window.Image();
      whole.src = item.wholeImage;
      const sliced = new window.Image();
      sliced.src = item.slicedImage;
    }
  }, []);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    missesRef.current = misses;
  }, [misses]);

  useEffect(() => {
    attemptsRef.current = attempts;
  }, [attempts]);

  useEffect(() => {
    wrongAttemptsRef.current = wrongAttempts;
  }, [wrongAttempts]);

  useEffect(() => {
    slicesRef.current = slices;
  }, [slices]);

  useEffect(() => {
    let alive = true;
    loadTemplates()
      .then((bundle) => {
        if (!alive) return;
        bundleRef.current = bundle;
        allLettersRef.current = bundle.letters.map((l) => l.letter);
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
      if (physicsRafRef.current) cancelAnimationFrame(physicsRafRef.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStageSize = useCallback((): StageSize => {
    const rect = stageRef.current?.getBoundingClientRect();
    return { width: rect?.width || 760, height: rect?.height || 500 };
  }, []);

  const addFloatingText = useCallback(
    (text: string, kind: FloatingText['kind'], fruitForText?: FruitState) => {
      const stage = getStageSize();
      const next: FloatingText = {
        id: floatingIdRef.current + 1,
        x: fruitForText?.x ?? stage.width / 2,
        y: fruitForText?.y ?? stage.height * 0.35,
        text,
        kind,
      };
      floatingIdRef.current = next.id;
      setFloatingTexts((items) => [...items.slice(-4), next]);
    },
    [getStageSize],
  );

  const nextFruit = useCallback(
    (scoreForLevel = scoreRef.current) => {
      const activeLevel = getLevel(scoreForLevel);
      const letters = allLettersRef.current.slice(0, activeLevel.letterLimit);
      const letter = pickLetter(
        letters.length ? letters : allLettersRef.current,
        targetRef.current,
      );
      const fruitIndex = fruitIdRef.current % FRUITS.length;
      const next = spawnFruit(
        fruitIdRef.current + 1,
        letter,
        fruitIndex,
        activeLevel,
        getStageSize(),
      );

      fruitIdRef.current = next.id;
      fruitRef.current = next;
      setFruit(next);
      setFeedback(null);
      setConfidence(0);
      lockedRef.current = false;
      bufferRef.current = [];
      emptyCountRef.current = 0;
      lastPhysicsTimeRef.current = null;
      setRecording(false);
      setStatus(t('game.alphabet.show', { letter }));
    },
    [getStageSize, t],
  );

  const finishGame = useCallback(
    (letter?: string) => {
      lockedRef.current = true;
      fruitRef.current = null;
      setFruit(null);
      setPhase('gameover');
      setRecording(false);
      setStatus(t('game.alphabet.gameOver', { score: scoreRef.current }));
      if (letter) setFeedback({ kind: 'miss', letter });
    },
    [t],
  );

  const registerFruitMiss = useCallback(
    (missedFruit: FruitState) => {
      if (missedFruit.hasMissed || missedFruit.isResolved || missedFruit.status !== 'flying')
        return;

      const resolvedFruit: FruitState = {
        ...missedFruit,
        hasMissed: true,
        isResolved: true,
        status: 'missed',
      };
      fruitRef.current = resolvedFruit;
      lockedRef.current = true;
      setFruit(null);
      setAttempts((a) => a + 1);
      setMisses((current) => {
        const nextMisses = current + 1;
        missesRef.current = nextMisses;
        if (nextMisses >= MAX_MISSES) {
          feedbackTimer.current = setTimeout(() => finishGame(missedFruit.letter), FEEDBACK_MS);
        } else {
          feedbackTimer.current = setTimeout(() => nextFruit(), FEEDBACK_MS);
        }
        return nextMisses;
      });
      addFloatingText('X', 'miss', missedFruit);
      setFeedback({ kind: 'miss', letter: missedFruit.letter });
      setStatus(t('game.alphabet.missed', { letter: missedFruit.letter }));
    },
    [addFloatingText, finishGame, nextFruit, t],
  );

  const resetGame = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    scoreRef.current = 0;
    missesRef.current = 0;
    attemptsRef.current = 0;
    wrongAttemptsRef.current = 0;
    slicesRef.current = 0;
    fruitRef.current = null;
    setScore(0);
    setMisses(0);
    setAttempts(0);
    setWrongAttempts(0);
    setSlices(0);
    setFloatingTexts([]);
    setFeedback(null);
    setConfidence(0);
    setPhase('playing');
    nextFruit(0);
  }, [nextFruit]);

  const finalizeGesture = useCallback(
    (seq: FeatureVector[]) => {
      if (seq.length < MIN_FRAMES || lockedRef.current) return;
      const bundle = bundleRef.current;
      const tgt = targetRef.current;
      const activeFruit = fruitRef.current;
      if (!bundle || !tgt || !activeFruit || activeFruit.status !== 'flying') return;

      const res = checkTarget(seq, bundle, tgt, thresholdRef.current);
      setConfidence(res.confidence);
      setAttempts((a) => a + 1);

      if (res.correct) {
        lockedRef.current = true;
        const points = calculateScoreBonus(performance.now() - activeFruit.spawnedAt);
        const nextScore = scoreRef.current + points;
        const slicedFruit: FruitState = {
          ...activeFruit,
          isResolved: true,
          status: 'sliced',
        };
        scoreRef.current = nextScore;
        slicesRef.current += 1;
        fruitRef.current = slicedFruit;
        setScore(nextScore);
        setSlices((count) => count + 1);
        setFeedback({ kind: 'correct', letter: tgt, points });
        addFloatingText(`+${points}`, 'bonus', activeFruit);
        setFruit(slicedFruit);
        setStatus(t('game.alphabet.correct', { letter: tgt }));
        feedbackTimer.current = setTimeout(() => nextFruit(nextScore), FEEDBACK_MS);
      } else {
        const nextScore = Math.max(0, scoreRef.current - WRONG_PENALTY);
        scoreRef.current = nextScore;
        wrongAttemptsRef.current += 1;
        setScore(nextScore);
        setWrongAttempts((count) => count + 1);
        setFeedback({ kind: 'wrong', letter: tgt, nearest: res.best?.letter });
        addFloatingText(`-${WRONG_PENALTY}`, 'penalty', activeFruit);
        setStatus(t('game.alphabet.wrongPenalty', { letter: tgt }));
      }
    },
    [addFloatingText, nextFruit, t],
  );

  const loop = useCallback(
    (landmarker: HolisticLandmarker) => {
      const v = camVideoRef.current;
      if (!v) return;

      if (v.currentTime !== lastTimeRef.current && v.readyState >= 2) {
        lastTimeRef.current = v.currentTime;
        const res = landmarker.detectForVideo(v, performance.now()) as unknown as HolisticResult;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finalizeGesture, recording],
  );

  useEffect(() => {
    if (!playing) return;

    const tick = (now: number) => {
      const previous = lastPhysicsTimeRef.current ?? now;
      const dt = Math.min((now - previous) / 1000, 0.034);
      lastPhysicsTimeRef.current = now;
      const current = fruitRef.current;

      if (current?.status === 'flying' && !current.isResolved) {
        const stage = getStageSize();
        const movedFruit: FruitState = {
          ...current,
          x: current.x + current.vx * dt,
          y: current.y + current.vy * dt,
          vy: current.vy + current.gravity * dt,
          rotation: current.rotation + current.rotationSpeed * dt,
        };
        const next: FruitState = isFruitInsideBounds(movedFruit, stage)
          ? { ...movedFruit, hasEnteredBounds: true }
          : movedFruit;

        fruitRef.current = next;
        applyFruitTransform(fruitElementRef.current, next);

        if (
          next.hasEnteredBounds &&
          isFruitOutOfBounds(next, stage) &&
          !next.hasMissed &&
          !next.isResolved
        ) {
          registerFruitMiss(next);
        }
      }

      physicsRafRef.current = requestAnimationFrame(tick);
    };

    physicsRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (physicsRafRef.current) cancelAnimationFrame(physicsRafRef.current);
      physicsRafRef.current = null;
      lastPhysicsTimeRef.current = null;
    };
  }, [getStageSize, playing, registerFruitMiss]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    setRecording(false);
  }, []);

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

      resetGame();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      loop(landmarker);
    } catch (e) {
      setPhase('error');
      setStatus(t('game.alphabet.cameraError'));
      console.error(e);
    }
  }, [loop, resetGame, t]);

  const stopGame = useCallback(() => {
    stopCamera();
    setPhase('ready');
    fruitRef.current = null;
    setFruit(null);
    setStatus(t('game.alphabet.ready'));
    setFeedback(null);
  }, [stopCamera, t]);

  const restart = useCallback(() => {
    resetGame();
  }, [resetGame]);

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
      drawConnections(ctx, pose, POSE_CONNECTIONS, 'rgba(190,242,100,0.72)', 3, cw, ch);
      drawPoints(
        ctx,
        [pose[0], pose[11], pose[12], pose[13], pose[14]].filter(Boolean),
        '#bef264',
        4,
        cw,
        ch,
      );
    }
    const lh = res.leftHandLandmarks?.[0];
    const rh = res.rightHandLandmarks?.[0];
    if (lh?.length) {
      drawConnections(ctx, lh, HAND_CONNECTIONS, 'rgba(34,197,94,0.95)', 3, cw, ch);
      drawPoints(ctx, lh, '#22c55e', 3.5, cw, ch);
    }
    if (rh?.length) {
      drawConnections(ctx, rh, HAND_CONNECTIONS, 'rgba(250,204,21,0.95)', 3, cw, ch);
      drawPoints(ctx, rh, '#facc15', 3.5, cw, ch);
    }
  }

  const currentFruit = fruit ? FRUITS[fruit.fruitIndex] : FRUITS[0];
  const fruitStyle = toFruitStyle(fruit);

  return (
    <div className="mx-auto max-w-6xl">
      <section
        aria-label={t('game.alphabet.targetLabel')}
        className="overflow-hidden rounded-2xl border border-emerald-900/40 bg-slate-950 shadow-xl"
      >
        <div
          ref={stageRef}
          className="alphabet-game-stage relative min-h-[520px] overflow-hidden sm:min-h-[620px]"
        >
          <div className="absolute left-3 right-3 top-3 z-20 flex flex-wrap items-center justify-between gap-2 sm:left-5 sm:right-5 sm:top-5">
            <div className="rounded-full border border-white/15 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur">
              {t('game.alphabet.score')}: <span className="text-lime-300">{score}</span>
            </div>
            <div className="rounded-full border border-white/15 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur">
              {t('game.alphabet.level')} {level.number}
            </div>
            <div className="flex items-center gap-1 rounded-full border border-white/15 bg-slate-950/70 px-2 py-1 shadow-lg backdrop-blur">
              {Array.from({ length: MAX_MISSES }, (_, index) => (
                <MissXIcon key={index} active={index < misses} />
              ))}
            </div>
          </div>

          <p className="absolute left-3 top-16 z-20 max-w-[calc(100%-1.5rem)] rounded-full border border-white/15 bg-slate-950/65 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur sm:left-5 sm:top-20">
            {status}
          </p>

          {fruit && playing && (
            <div
              key={fruit.id}
              ref={fruitElementRef}
              className={[
                'alphabet-fruit-physics absolute z-10',
                fruit.status === 'sliced' ? 'is-sliced' : 'is-flying',
              ].join(' ')}
              style={fruitStyle}
              aria-label={`${currentFruit.label} ${fruit.letter}`}
            >
              <div className="alphabet-fruit-piece whole">
                <Image
                  src={currentFruit.wholeImage}
                  alt=""
                  fill
                  sizes="122px"
                  priority
                  draggable={false}
                />
                <span>{fruit.letter}</span>
              </div>
              <div className="alphabet-fruit-piece left">
                <Image
                  src={currentFruit.slicedImage}
                  alt=""
                  fill
                  sizes="122px"
                  priority
                  draggable={false}
                />
                <span>{fruit.letter}</span>
              </div>
              <div className="alphabet-fruit-piece right">
                <Image
                  src={currentFruit.slicedImage}
                  alt=""
                  fill
                  sizes="122px"
                  priority
                  draggable={false}
                />
                <span>{fruit.letter}</span>
              </div>
              <div className="alphabet-slice-line" />
            </div>
          )}

          {floatingTexts.map((item) => (
            <span
              key={item.id}
              className={`alphabet-floating-score is-${item.kind}`}
              style={{ left: item.x, top: item.y }}
              onAnimationEnd={(event: AnimationEvent<HTMLSpanElement>) => {
                const id = item.id;
                if (event.animationName === 'alphabet-float-score') {
                  setFloatingTexts((items) => items.filter((next) => next.id !== id));
                }
              }}
            >
              {item.text}
            </span>
          ))}

          <section
            aria-label={t('game.alphabet.cameraLabel')}
            className="absolute bottom-3 right-3 z-20 w-36 overflow-hidden rounded-xl border border-white/20 bg-slate-950 shadow-2xl sm:bottom-5 sm:right-5 sm:w-52"
          >
            <div className="relative aspect-[4/3] w-full">
              {recording && (
                <span className="absolute left-2 top-2 z-10 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
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
              {!streamRef.current && <div className="absolute inset-0 bg-slate-950/80" />}
            </div>
          </section>

          {playing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={stopGame}
              className="absolute bottom-3 left-3 z-20 border border-white/15 bg-slate-950/60 text-white hover:bg-slate-900 sm:bottom-5 sm:left-5"
            >
              {t('game.alphabet.stop')}
            </Button>
          )}

          {!playing && (
            <div className="alphabet-game-cover absolute inset-0 z-30 grid place-items-center bg-slate-950/72 p-5 text-center text-white backdrop-blur-sm">
              {phase === 'gameover' ? (
                <div className="alphabet-gameover-panel w-full max-w-md rounded-2xl border border-white/15 bg-slate-950/80 p-5 shadow-2xl sm:p-7">
                  <p className="text-2xl font-black tracking-tight">
                    {t('game.alphabet.gameOverTitle')}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                    <div className="rounded-xl bg-white/10 p-3">
                      <dt className="text-xs text-white/65">{t('game.alphabet.finalScore')}</dt>
                      <dd className="text-2xl font-black text-lime-300">{score}</dd>
                    </div>
                    <div className="rounded-xl bg-white/10 p-3">
                      <dt className="text-xs text-white/65">{t('game.alphabet.totalSlices')}</dt>
                      <dd className="text-2xl font-black">{slices}</dd>
                    </div>
                    <div className="rounded-xl bg-white/10 p-3">
                      <dt className="text-xs text-white/65">{t('game.alphabet.totalMisses')}</dt>
                      <dd className="text-2xl font-black text-red-400">{misses}</dd>
                    </div>
                    <div className="rounded-xl bg-white/10 p-3">
                      <dt className="text-xs text-white/65">{t('game.alphabet.wrongAttempts')}</dt>
                      <dd className="text-2xl font-black text-amber-300">{wrongAttempts}</dd>
                    </div>
                    <div className="col-span-2 rounded-xl bg-white/10 p-3 text-center">
                      <dt className="text-xs text-white/65">{t('game.alphabet.accuracy')}</dt>
                      <dd className="text-2xl font-black">{accuracy}%</dd>
                    </div>
                  </div>
                  <Button size="lg" onClick={restart} className="mt-6">
                    <RotateCcw aria-hidden className="mr-2 h-4 w-4" />
                    {t('game.alphabet.restart')}
                  </Button>
                </div>
              ) : (
                <div className="max-w-sm">
                  <p className="text-xl font-bold">{t('game.alphabet.readyTitle')}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">{status}</p>
                  <Button
                    size="lg"
                    onClick={startCamera}
                    disabled={phase === 'loading' || phase === 'starting'}
                    loading={phase === 'starting'}
                    className="mt-5"
                  >
                    {t('game.alphabet.start')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* <section className="rounded-2xl border border-border bg-surface p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-surface-muted px-2 py-3">
                <dt className="text-xs text-fg-subtle">{t('game.alphabet.level')}</dt>
                <dd className="text-2xl font-bold text-fg">{level.number}</dd>
              </div>
              <div className="rounded-xl bg-surface-muted px-2 py-3">
                <dt className="text-xs text-fg-subtle">{t('game.alphabet.score')}</dt>
                <dd className="text-2xl font-bold text-fg">{score}</dd>
              </div>
              <div className="rounded-xl bg-surface-muted px-2 py-3">
                <dt className="text-xs text-fg-subtle">{t('game.alphabet.misses')}</dt>
                <dd className="text-2xl font-bold text-danger">{misses}</dd>
              </div>
            </div>

            <p className="mt-4 min-h-6 text-center text-sm font-semibold" aria-live="assertive">
              {feedback?.kind === 'correct' && (
                <span className="text-success">
                  {t('game.alphabet.sliceShort', { letter: feedback.letter })}
                </span>
              )}
              {feedback?.kind === 'wrong' && (
                <span className="text-danger">{t('game.alphabet.wrongNextShort')}</span>
              )}
              {feedback?.kind === 'miss' && (
                <span className="text-danger">{t('game.alphabet.missedShort')}</span>
              )}
            </p>

            <div className="mt-4">
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
          </section> */}

      <p className="mt-6 text-center text-xs text-fg-subtle">{t('game.alphabet.privacy')}</p>
    </div>
  );
}
