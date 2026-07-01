'use client';

// Shared webcam + sign-recognition controller for the "Sign TypeRacer" games.
//
// Reuses the existing on-device pipeline as-is — `getHolistic()` (MediaPipe
// HolisticLandmarker singleton), `resultToVector`/`hasHands` (features) and the
// DTW recognizer's `checkTarget`. Nothing here re-implements recognition; it
// only orchestrates a continuous "hold the sign for the current target letter"
// loop suitable for a typing race, plus camera-permission state, a PiP overlay,
// throttled matching and full teardown.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getHolistic } from './holistic';
import { hasHands, resultToVector, type HolisticResult } from './features';
import type { FeatureVector } from './features';
import { checkTarget, loadTemplates, type TemplateBundle } from './recognizer';

export type CaptureStatus =
  | 'loading' // templates downloading
  | 'ready' // templates loaded, camera not yet started
  | 'requesting' // asking for camera permission
  | 'denied' // permission refused
  | 'nocam' // no camera device
  | 'active' // camera running
  | 'error';

const MIN_FRAMES = 8;
const MAX_FRAMES = 48; // sliding window kept for matching (resampled to SEQ_LEN)
const RECOG_INTERVAL_MS = 120; // throttle DTW — don't match every frame
const CONFIRM_HITS = 2; // consecutive positive checks before accepting
const EMPTY_TO_RESET = 6; // frames without a hand that reset the buffer
const MATCH_LOCK_MS = 420; // ignore input briefly after a match

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9],
  [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17],
  [17, 18], [18, 19], [19, 20], [0, 17],
];
const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
];

export interface SignCaptureOptions {
  /** Fired once when the current target letter is recognised (sustained). */
  onMatch: (letter: string) => void;
  onError?: (error: unknown) => void;
}

export interface SignCapture {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: CaptureStatus;
  /** Templates + model loaded (camera may or may not be running). */
  ready: boolean;
  letters: string[];
  recording: boolean;
  confidence: number;
  /** Request the camera and begin the recognition loop. */
  start: () => Promise<void>;
  /** Stop the camera and loop entirely (releases the device). */
  stop: () => void;
  /** Pause/resume recognition without releasing the camera (intro/countdown). */
  setActive: (on: boolean) => void;
  /** Set the letter currently being matched (null = match nothing). */
  setTarget: (letter: string | null) => void;
}

export function useSignCapture({ onMatch, onError }: SignCaptureOptions): SignCapture {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = useState<CaptureStatus>('loading');
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [letters, setLetters] = useState<string[]>([]);

  const bundleRef = useRef<TemplateBundle | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<FeatureVector[]>([]);
  const emptyRef = useRef(0);
  const confirmRef = useRef(0);
  const lastRecogRef = useRef(0);
  const lastTimeRef = useRef(-1);
  const lockedRef = useRef(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = useRef<string | null>(null);
  const pausedRef = useRef(true);
  const recordingRef = useRef(false);
  const holisticRef = useRef<Awaited<ReturnType<typeof getHolistic>> | null>(null);

  // Keep the latest callbacks without re-subscribing the loop.
  const onMatchRef = useRef(onMatch);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onMatchRef.current = onMatch;
    onErrorRef.current = onError;
  });

  // Load recognizer templates once.
  useEffect(() => {
    let alive = true;
    loadTemplates()
      .then((bundle) => {
        if (!alive) return;
        bundleRef.current = bundle;
        setLetters(bundle.letters.map((l) => l.letter));
        setReady(true);
        setStatus('ready');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setStatus('error');
        onErrorRef.current?.(e);
      });
    return () => {
      alive = false;
    };
  }, []);

  const resetBuffer = useCallback(() => {
    bufferRef.current = [];
    emptyRef.current = 0;
    confirmRef.current = 0;
    setRecording(false);
    setConfidence(0);
  }, []);

  const setTarget = useCallback(
    (letter: string | null) => {
      targetRef.current = letter;
      resetBuffer();
    },
    [resetBuffer],
  );

  const setActive = useCallback(
    (on: boolean) => {
      pausedRef.current = !on;
      if (!on) resetBuffer();
    },
    [resetBuffer],
  );

  const drawOverlay = useCallback((res: HolisticResult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    const line = (lm: { x: number; y: number }[], conns: [number, number][], color: string, w: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      for (const [a, b] of conns) {
        if (!lm[a] || !lm[b]) continue;
        ctx.beginPath();
        ctx.moveTo(lm[a].x * cw, lm[a].y * ch);
        ctx.lineTo(lm[b].x * cw, lm[b].y * ch);
        ctx.stroke();
      }
    };
    const dots = (lm: { x: number; y: number }[], color: string, r: number) => {
      ctx.fillStyle = color;
      for (const p of lm) {
        ctx.beginPath();
        ctx.arc(p.x * cw, p.y * ch, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const pose = res.poseLandmarks?.[0];
    if (pose) {
      line(pose, POSE_CONNECTIONS, 'rgba(125,140,255,0.7)', 3);
      dots([pose[0], pose[11], pose[12], pose[13], pose[14]].filter(Boolean), '#7d8cff', 4);
    }
    const lh = res.leftHandLandmarks?.[0];
    const rh = res.rightHandLandmarks?.[0];
    if (lh?.length) {
      line(lh, HAND_CONNECTIONS, 'rgba(52,214,189,0.95)', 3);
      dots(lh, '#34d6bd', 3.5);
    }
    if (rh?.length) {
      line(rh, HAND_CONNECTIONS, 'rgba(255,178,77,0.95)', 3);
      dots(rh, '#ffb24d', 3.5);
    }
  }, []);

  const tryMatch = useCallback(() => {
    const bundle = bundleRef.current;
    const target = targetRef.current;
    if (!bundle || !target) return;
    const buf = bufferRef.current;
    if (buf.length < MIN_FRAMES) return;

    const window = buf.length > MAX_FRAMES ? buf.slice(-MAX_FRAMES) : buf.slice();
    const res = checkTarget(window, bundle, target, bundle.threshold);
    setConfidence(res.confidence);

    if (res.correct) {
      confirmRef.current += 1;
      if (confirmRef.current >= CONFIRM_HITS) {
        // Accepted — lock briefly so the lingering hold can't double-fire, then
        // hand control back to the caller to advance the target.
        lockedRef.current = true;
        confirmRef.current = 0;
        bufferRef.current = [];
        setRecording(false);
        if (lockTimer.current) clearTimeout(lockTimer.current);
        lockTimer.current = setTimeout(() => {
          lockedRef.current = false;
        }, MATCH_LOCK_MS);
        onMatchRef.current(target);
      }
    } else {
      confirmRef.current = 0;
    }
  }, []);

  const loop = useCallback(
    (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (pausedRef.current) return;
      const v = videoRef.current;
      if (!v || v.readyState < 2 || v.currentTime === lastTimeRef.current) return;
      lastTimeRef.current = v.currentTime;

      const landmarker = holisticRef.current;
      if (!landmarker) return;
      const res = landmarker.detectForVideo(v, now) as unknown as HolisticResult;
      drawOverlay(res);
      if (lockedRef.current) return;

      const vec = resultToVector(res);
      const present = !!vec && hasHands(res);
      if (present && vec) {
        const buf = bufferRef.current;
        buf.push(vec);
        if (buf.length > MAX_FRAMES) buf.shift();
        emptyRef.current = 0;
        if (!recordingRef.current) {
          recordingRef.current = true;
          setRecording(true);
        }
        if (now - lastRecogRef.current >= RECOG_INTERVAL_MS) {
          lastRecogRef.current = now;
          tryMatch();
        }
      } else if (bufferRef.current.length > 0) {
        emptyRef.current += 1;
        if (emptyRef.current >= EMPTY_TO_RESET) resetBuffer();
      }
    },
    [drawOverlay, resetBuffer, tryMatch],
  );

  // Mirror `recording` into a ref so the loop doesn't churn on each toggle.
  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (lockTimer.current) clearTimeout(lockTimer.current);
    pausedRef.current = true;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    const v = videoRef.current;
    if (v) v.srcObject = null;
    resetBuffer();
  }, [resetBuffer]);

  const start = useCallback(async () => {
    if (!bundleRef.current) return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('nocam');
      return;
    }
    try {
      setStatus('requesting');
      const landmarker = await getHolistic();
      holisticRef.current = landmarker;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (!v) return;
      v.srcObject = stream;
      await v.play();

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = v.videoWidth || 640;
        canvas.height = v.videoHeight || 480;
      }

      resetBuffer();
      lastTimeRef.current = -1;
      lockedRef.current = false;
      setStatus('active');
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      const err = e as { name?: string };
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') setStatus('denied');
      else if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') setStatus('nocam');
      else {
        setStatus('error');
        onErrorRef.current?.(e);
      }
    }
  }, [loop, resetBuffer]);

  // Pause recognition while the tab is hidden (saves CPU / battery).
  useEffect(() => {
    const onVisibility = (): void => {
      if (document.hidden && !pausedRef.current) pausedRef.current = true;
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Teardown on unmount.
  useEffect(() => () => stop(), [stop]);

  return {
    videoRef,
    canvasRef,
    status,
    ready,
    letters,
    recording,
    confidence,
    start,
    stop,
    setActive,
    setTarget,
  };
}
