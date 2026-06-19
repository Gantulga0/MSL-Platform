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
import { TopicSelect } from '@/components/dictionary/TopicSelect';
import { ImagePicker, type PickerOption } from '@/components/admin/ImagePicker';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';
import { VideoCapture } from './VideoCapture';

/** Mongolian Cyrillic only (mirrors the API CYRILLIC_LEMMA_PATTERN). */
const CYRILLIC_PATTERN = /^[А-Яа-яЁёӨөҮү\s,-]+$/u;

const selectCls =
  'h-control-sm w-full rounded-md border border-border-strong bg-bg px-3 text-base text-fg';

interface Props {
  isAuthenticated: boolean;
  topics: TopicNode[];
  ageGroups: TaxoRef[];
  handednesses: TaxoRef[];
}

export function SubmitForm({
  isAuthenticated,
  topics,
  ageGroups,
  handednesses,
}: Props): React.ReactElement {
  const [lemma, setLemma] = useState('');
  const [topicId, setTopicId] = useState('');
  const [ageGroupId, setAgeGroupId] = useState('');
  const [handCount, setHandCount] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [hint, setHint] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const lemmaInvalid = lemma.trim().length > 0 && !CYRILLIC_PATTERN.test(lemma.trim());

  const handCountOptions: PickerOption[] = handednesses.map((h) => ({
    id: String(h.handCount ?? ''),
    label: h.label ?? '',
    imageUrl: h.imageUrl,
  }));

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
    if (!topicId) {
      setShowFieldErrors(true);
      setError(t('submit.topicRequired'));
      return;
    }
    if (!ageGroupId) {
      setShowFieldErrors(true);
      setError(t('submit.ageRequired'));
      return;
    }
    if (!handCount) {
      setShowFieldErrors(true);
      setError(t('submit.handsRequired'));
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
    fd.set('topicId', topicId);
    fd.set('ageGroupId', ageGroupId);
    fd.set('handCount', handCount);
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

      <Field label={t('submit.topic')} required>
        <TopicSelect
          name="topicId"
          topics={topics}
          value={topicId}
          onChange={setTopicId}
          required
          ariaLabel={t('submit.topic')}
          placeholder={t('submit.selectTopic')}
        />
      </Field>

      <Field
        label={t('submit.age')}
        required
        error={showFieldErrors && !ageGroupId ? t('submit.ageRequired') : undefined}
      >
        <select
          name="ageGroupId"
          className={selectCls}
          required
          value={ageGroupId}
          onChange={(e) => setAgeGroupId(e.target.value)}
          aria-label={t('submit.age')}
        >
          <option value="" disabled>
            {t('submit.selectAge')}
          </option>
          {ageGroups.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={t('dict.hands')}
        required
        error={showFieldErrors && !handCount ? t('submit.handsRequired') : undefined}
      >
        <ImagePicker
          name="handCount"
          options={handCountOptions}
          columns={2}
          imageOnly
          onChange={(ids) => setHandCount(ids[0] ?? '')}
        />
      </Field>

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
