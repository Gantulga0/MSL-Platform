'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, Video as VideoIcon } from 'lucide-react';
import { Button, cn } from '@msl/ui';
import { translate as t } from '@/i18n';

type Mode = 'record' | 'upload';

interface Props {
  /** Called whenever the chosen video changes (recorded or picked). */
  onChange: (file: File | null) => void;
  /** Allowed upload MIME list, mirrored from the media API. */
  accept?: string;
}

/**
 * Deaf-first video capture (FR-02): record straight from the webcam with
 * MediaRecorder, or upload an existing file. Keyboard-operable, visible state,
 * and the camera stream is always torn down on unmount / mode switch.
 */
export function VideoCapture({ onChange, accept = 'video/mp4,video/webm' }: Props): React.ReactElement {
  const [mode, setMode] = useState<Mode>('record');
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasClip, setHasClip] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const liveRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopTimer(): void {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  const elapsedLabel = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  function stopStream(): void {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (liveRef.current) liveRef.current.srcObject = null;
  }

  // Always release the camera + revoke object URLs when leaving the component.
  useEffect(() => {
    return () => {
      stopStream();
      stopTimer();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetClip(): void {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setHasClip(false);
    onChange(null);
  }

  async function startRecording(): Promise<void> {
    setError(null);
    resetClip();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (liveRef.current) {
        liveRef.current.srcObject = stream;
        liveRef.current.muted = true;
        await liveRef.current.play().catch(() => undefined);
      }
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stopTimer();
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `signing-${Date.now()}.webm`, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setHasClip(true);
        onChange(file);
        stopStream();
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setElapsed(0);
      const startedAt = Date.now();
      stopTimer();
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    } catch {
      setError(t('submit.cameraError'));
      stopStream();
    }
  }

  function stopRecording(): void {
    recorderRef.current?.stop();
    stopTimer();
    setRecording(false);
  }

  function switchMode(next: Mode): void {
    if (next === mode) return;
    if (recording) stopRecording();
    stopStream();
    resetClip();
    setError(null);
    setMode(next);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0] ?? null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setHasClip(true);
      onChange(file);
    } else {
      setPreviewUrl(null);
      setHasClip(false);
      onChange(null);
    }
  }

  const tabCls = (active: boolean): string =>
    cn(
      'inline-flex min-h-touch flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium',
      active ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted',
    );

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label={t('submit.videoMethod')} className="flex gap-1 rounded-lg bg-surface-muted p-1">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'record'}
          className={tabCls(mode === 'record')}
          onClick={() => switchMode('record')}
        >
          <Camera aria-hidden className="h-5 w-5" />
          {t('submit.tabRecord')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'upload'}
          className={tabCls(mode === 'upload')}
          onClick={() => switchMode('upload')}
        >
          <Upload aria-hidden className="h-5 w-5" />
          {t('submit.tabUpload')}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-danger bg-danger-subtle p-3 text-sm text-fg">
          {error}
        </p>
      )}

      {/* Live camera preview while recording (hidden once a clip exists). */}
      {mode === 'record' && !hasClip && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border border-border bg-black">
            <video ref={liveRef} playsInline muted className="aspect-video w-full" aria-label={t('submit.cameraPreview')} />
          </div>
          {recording ? (
            <Button type="button" variant="danger" block onClick={stopRecording}>
              <span aria-hidden className="mr-2 inline-block h-3 w-3 animate-pulse rounded-full bg-white" />
              {t('submit.stopRecord')}
              <span className="ml-2 tabular-nums text-sm" aria-live="polite">
                {elapsedLabel}
              </span>
            </Button>
          ) : (
            <Button type="button" block onClick={() => void startRecording()}>
              <Camera aria-hidden className="h-5 w-5" />
              {t('submit.startRecord')}
            </Button>
          )}
        </div>
      )}

      {mode === 'upload' && !hasClip && (
        <label className="flex min-h-touch cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-strong bg-surface-muted p-6 text-center text-sm text-fg-muted">
          <VideoIcon aria-hidden className="h-8 w-8" />
          <span>{t('submit.uploadHint')}</span>
          <input type="file" accept={accept} className="sr-only" onChange={onFile} />
        </label>
      )}

      {/* Recorded / chosen clip with a re-take action. */}
      {hasClip && previewUrl && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border border-border bg-black">
            <video src={previewUrl} controls playsInline className="aspect-video w-full" aria-label={t('submit.videoReady')} />
          </div>
          <Button type="button" variant="secondary" block onClick={() => (mode === 'record' ? void startRecording() : resetClip())}>
            {mode === 'record' ? t('submit.reRecord') : t('submit.reSelect')}
          </Button>
        </div>
      )}
    </div>
  );
}
