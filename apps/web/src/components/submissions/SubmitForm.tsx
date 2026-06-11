'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { AlertTriangle } from 'lucide-react';
import { Button, Field, Input } from '@msl/ui';
import { translate as t } from '@/i18n';
import { FormAlert } from '@/components/auth/FormAlert';
import {
  checkDuplicateAction,
  createSubmissionAction,
  type CheckResult,
  type SubmitResult,
} from '@/lib/submissions/actions';
import { VideoCapture } from './VideoCapture';

/** Mongolian Cyrillic only (mirrors the API CYRILLIC_LEMMA_PATTERN). */
const CYRILLIC_PATTERN = /^[А-Яа-яЁёӨөҮү\s-]+$/u;

interface Props {
  isAuthenticated: boolean;
}

export function SubmitForm({ isAuthenticated }: Props): React.ReactElement {
  const [lemma, setLemma] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [hint, setHint] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const lemmaInvalid = lemma.trim().length > 0 && !CYRILLIC_PATTERN.test(lemma.trim());

  useEffect(() => {
    const term = lemma.trim();
    if (!term || !CYRILLIC_PATTERN.test(term)) {
      setHint(null);
      return;
    }
    setChecking(true);
    const handle = setTimeout(async () => {
      const res = await checkDuplicateAction(term);
      setHint(res);
      setChecking(false);
    }, 400);
    return () => clearTimeout(handle);
  }, [lemma]);

  if (result && !result.error && !result.loginRequired) {
    return (
      <div className="space-y-4">
        {result.duplicate ? (
          <>
            <FormAlert tone="error">{t('submit.dupConfirmed')}</FormAlert>
            {result.existingWord && (
              <Link
                href={`/dictionary/${result.existingWord.id}` as Route}
                className="text-primary underline"
              >
                {t('submit.viewExisting')}: {result.existingWord.lemma}
              </Link>
            )}
          </>
        ) : (
          <>
            <FormAlert tone="success">{t('submit.successBody')}</FormAlert>
            <Link href={'/profile' as Route} className="text-primary underline">
              {t('submit.goProfile')}
            </Link>
          </>
        )}
      </div>
    );
  }

  function onSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!isAuthenticated) {
      setError(t('submit.loginRequired'));
      return;
    }
    if (lemmaInvalid || !lemma.trim()) {
      setError(t('submit.lemmaInvalid'));
      return;
    }
    if (!video) {
      setError(t('submit.videoRequired'));
      return;
    }
    if (!consent) {
      setError(t('submit.consentRequired'));
      return;
    }
    setError(undefined);
    const fd = new FormData();
    fd.set('proposedLemma', lemma.trim());
    fd.set('file', video);
    fd.set('consent', 'on');
    start(async () => {
      const res = await createSubmissionAction(fd);
      if (res.loginRequired) setError(t('submit.loginRequired'));
      else if (res.error) setError(res.error);
      else setResult(res);
    });
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      {error && <FormAlert tone="error">{error}</FormAlert>}

      <Field
        label={t('submit.lemma')}
        required
        description={t('submit.lemmaCyrillicHint')}
        error={lemmaInvalid ? t('submit.lemmaInvalid') : undefined}
      >
        <Input
          name="proposedLemma"
          required
          maxLength={120}
          value={lemma}
          onChange={(e) => setLemma(e.target.value)}
          lang="mn"
        />
      </Field>

      {checking && <p className="text-sm text-fg-subtle">{t('submit.checking')}</p>}
      {!checking && hint && hint.candidates.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-warning bg-warning-subtle p-3 text-sm text-fg"
        >
          <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="font-medium">{t('submit.dupWarning')}</p>
            <ul className="mt-1 list-disc ps-5">
              {hint.candidates.slice(0, 3).map((c) => (
                <li key={c.wordId}>
                  <Link href={`/dictionary/${c.wordId}` as Route} className="text-primary underline">
                    {c.lemma}
                  </Link>{' '}
                  <span className="text-fg-subtle">({Math.round(c.score * 100)}%)</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Field label={t('submit.video')} required>
        {isAuthenticated ? (
          <VideoCapture onChange={setVideo} />
        ) : (
          <p className="rounded-md border border-border bg-surface-muted p-3 text-sm text-fg-muted">
            {t('submit.loginRequired')}
          </p>
        )}
      </Field>

      {isAuthenticated && (
        <label className="flex items-start gap-2 text-sm text-fg">
          <input
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-primary"
          />
          <span>{t('submit.consent')}</span>
        </label>
      )}

      <Button type="submit" block loading={pending}>
        {isAuthenticated ? t('submit.button') : t('submit.loginToSubmit')}
      </Button>
    </form>
  );
}
