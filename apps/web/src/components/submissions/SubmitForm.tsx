'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button, Field, Input } from '@msl/ui';
import { useT } from '@/i18n/client';
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
  'h-control-sm w-full rounded-lg border border-border-strong bg-bg px-3 text-base text-fg transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const STEPS = ['submit.step1', 'submit.step2', 'submit.step3'] as const;

function flattenTopics(nodes: TopicNode[]): TopicNode[] {
  return nodes.flatMap((n) => [n, ...flattenTopics(n.children ?? [])]);
}

interface Props {
  isAuthenticated: boolean;
  topics: TopicNode[];
  ageGroups: TaxoRef[];
  handednesses: TaxoRef[];
}

/**
 * Word submission as a mobile-first 3-step wizard (FR-02): (1) word + taxonomy,
 * (2) video, (3) review + consent. Splitting the long form lowers cognitive load,
 * each step gates on its own inline validation, and the final step shows a review
 * summary before submit. Duplicate detection runs live on step 1. Submit stays
 * wired to `createSubmissionAction`; honours reduced-motion (NFR-01).
 */
export function SubmitForm({
  isAuthenticated,
  topics,
  ageGroups,
  handednesses,
}: Props): React.ReactElement {
  const t = useT();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
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
  // Per-field validation errors, rendered inline on each <Field> (not just as a
  // single top banner) so the user sees exactly which control needs attention.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [pending, start] = useTransition();

  const clearFieldError = (key: string): void =>
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

  const lemmaInvalid = lemma.trim().length > 0 && !CYRILLIC_PATTERN.test(lemma.trim());

  const handCountOptions: PickerOption[] = handednesses.map((h) => ({
    id: String(h.handCount ?? ''),
    label: h.label ?? '',
    imageUrl: h.imageUrl,
  }));

  const flatTopics = useMemo(() => flattenTopics(topics), [topics]);
  const topicName = (id: string): string => flatTopics.find((n) => n.id === id)?.name ?? '';

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

  // ── Success / duplicate result screen ──────────────────────────────────────
  if (result && !result.error && !result.loginRequired) {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
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
          <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
            <span className="mx-auto grid h-14 w-14 place-content-center rounded-full bg-success-subtle text-success">
              <Check aria-hidden className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-fg">{t('submit.successTitle')}</h2>
            <p className="mt-1 text-fg-muted">{t('submit.successBody')}</p>
            <Link href={'/profile' as Route} className="mt-4 inline-block font-semibold text-primary underline">
              {t('submit.goProfile')}
            </Link>
          </div>
        )}
      </motion.div>
    );
  }

  // ── Per-step validation gate ────────────────────────────────────────────────
  // Populates per-field errors (rendered inline on each Field) and returns
  // whether the step is valid.
  function validateStep(s: number): boolean {
    const fe: Record<string, string | undefined> = {};
    if (s === 0) {
      if (!lemma.trim()) fe.lemma = t('submit.lemmaRequired');
      else if (lemmaInvalid) fe.lemma = t('submit.lemmaInvalid');
      if (!topicId) fe.topic = t('submit.topicRequired');
      if (!ageGroupId) fe.age = t('submit.ageRequired');
      if (!handCount) fe.hands = t('submit.handsRequired');
    }
    // Guests can't record a video; let them reach the review step, where the
    // submit button prompts login instead (matches the guest "fill now" flow).
    if (s === 1 && isAuthenticated && !video) fe.video = t('submit.videoRequired');
    setFieldErrors(fe);
    return Object.values(fe).every((v) => !v);
  }

  function next(): void {
    if (!validateStep(step)) return;
    setError(undefined);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back(): void {
    setError(undefined);
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit(): void {
    if (!isAuthenticated) {
      setError(t('submit.loginRequired'));
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

  const dir = reduce ? 0 : 1;

  return (
    <div className="space-y-6">
      {/* Progress stepper */}
      <ol className="flex items-center gap-2" aria-label={t('submit.progress')}>
        {STEPS.map((labelKey, i) => (
          <li key={labelKey} className="flex flex-1 items-center gap-2">
            <span
              aria-current={i === step ? 'step' : undefined}
              className={`grid h-8 w-8 shrink-0 place-content-center rounded-full text-sm font-bold transition-colors ${
                i < step
                  ? 'bg-success text-fg-on-primary'
                  : i === step
                    ? 'bg-primary text-fg-on-primary'
                    : 'bg-surface-muted text-fg-muted'
              }`}
            >
              {i < step ? <Check aria-hidden className="h-4 w-4" /> : i + 1}
            </span>
            <span className={`hidden text-sm sm:block ${i === step ? 'font-semibold text-fg' : 'text-fg-muted'}`}>
              {t(labelKey)}
            </span>
            {i < STEPS.length - 1 && <span aria-hidden className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      {error && <FormAlert tone="error">{error}</FormAlert>}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: dir * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -24 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          {/* STEP 1 — word + taxonomy */}
          {step === 0 && (
            <>
              <Field
                label={t('submit.lemma')}
                required
                description={t('submit.lemmaCyrillicHint')}
                error={fieldErrors.lemma ?? (lemmaInvalid ? t('submit.lemmaInvalid') : undefined)}
              >
                <Input
                  name="proposedLemma"
                  required
                  maxLength={120}
                  value={lemma}
                  onChange={(e) => {
                    setLemma(e.target.value);
                    clearFieldError('lemma');
                  }}
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

              <Field label={t('submit.topic')} required error={fieldErrors.topic}>
                <TopicSelect
                  name="topicId"
                  topics={topics}
                  value={topicId}
                  onChange={(id) => {
                    setTopicId(id);
                    clearFieldError('topic');
                  }}
                  required
                  ariaLabel={t('submit.topic')}
                  placeholder={t('submit.selectTopic')}
                />
              </Field>

              <Field label={t('submit.age')} required error={fieldErrors.age}>
                <select
                  name="ageGroupId"
                  className={selectCls}
                  required
                  value={ageGroupId}
                  onChange={(e) => {
                    setAgeGroupId(e.target.value);
                    clearFieldError('age');
                  }}
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

              <Field label={t('dict.hands')} required error={fieldErrors.hands}>
                <ImagePicker
                  name="handCount"
                  options={handCountOptions}
                  columns={2}
                  imageOnly
                  onChange={(ids) => {
                    setHandCount(ids[0] ?? '');
                    clearFieldError('hands');
                  }}
                />
              </Field>
            </>
          )}

          {/* STEP 2 — video */}
          {step === 1 && (
            <Field label={t('submit.video')} required error={fieldErrors.video}>
              {isAuthenticated ? (
                <VideoCapture
                  onChange={(f) => {
                    setVideo(f);
                    clearFieldError('video');
                  }}
                />
              ) : (
                <p className="rounded-md border border-border bg-surface-muted p-3 text-sm text-fg-muted">
                  {t('submit.loginRequired')}
                </p>
              )}
            </Field>
          )}

          {/* STEP 3 — review + consent */}
          {step === 2 && (
            <div className="space-y-4">
              <dl className="divide-y divide-border rounded-2xl border border-border bg-surface">
                {[
                  [t('submit.lemma'), lemma.trim()],
                  [t('submit.topic'), topicName(topicId)],
                  [t('submit.age'), ageGroups.find((a) => a.id === ageGroupId)?.label ?? ''],
                  [t('dict.hands'), handednesses.find((h) => String(h.handCount) === handCount)?.label ?? handCount],
                  [t('submit.video'), video ? t('submit.videoReady') : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                    <dt className="text-sm text-fg-muted">{k}</dt>
                    <dd className="text-right text-sm font-medium text-fg">{v}</dd>
                  </div>
                ))}
              </dl>

              {isAuthenticated && (
                <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-3.5 text-sm text-fg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
                  <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-accent-ink" />
                  <input
                    name="consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
                  />
                  <span>{t('submit.consent')}</span>
                </label>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Step navigation */}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          variant="ghost"
          onClick={back}
          disabled={step === 0}
          className={step === 0 ? 'invisible' : ''}
        >
          <ArrowLeft aria-hidden className="h-5 w-5" />
          {t('common.previous')}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>
            {t('common.next')}
            <ArrowRight aria-hidden className="h-5 w-5" />
          </Button>
        ) : (
          <Button onClick={submit} loading={pending}>
            {isAuthenticated ? t('submit.button') : t('submit.loginToSubmit')}
          </Button>
        )}
      </div>
    </div>
  );
}
