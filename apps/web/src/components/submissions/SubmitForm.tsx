'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { AlertTriangle } from 'lucide-react';
import { Button, Field, Input, Textarea } from '@msl/ui';
import { translate as t } from '@/i18n';
import { FormAlert } from '@/components/auth/FormAlert';
import {
  checkDuplicateAction,
  createSubmissionAction,
  type CheckResult,
  type SubmitResult,
} from '@/lib/submissions/actions';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';

function flatten(nodes: TopicNode[], depth = 0): { id: string; name: string; depth: number }[] {
  return nodes.flatMap((n) => [
    { id: n.id, name: n.name, depth },
    ...flatten(n.children, depth + 1),
  ]);
}

interface Props {
  topics: TopicNode[];
  levels: TaxoRef[];
  ageGroups: TaxoRef[];
  isAuthenticated: boolean;
}

const selectCls = 'h-control-sm w-full rounded-md border border-border-strong bg-bg px-3 text-base text-fg';

export function SubmitForm({ topics, levels, ageGroups, isAuthenticated }: Props): React.ReactElement {
  const topicOptions = flatten(topics);
  const [lemma, setLemma] = useState('');
  const [topicId, setTopicId] = useState('');
  const [hint, setHint] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  useEffect(() => {
    const term = lemma.trim();
    if (!term) {
      setHint(null);
      return;
    }
    setChecking(true);
    const handle = setTimeout(async () => {
      const res = await checkDuplicateAction(term, topicId || undefined);
      setHint(res);
      setChecking(false);
    }, 400);
    return () => clearTimeout(handle);
  }, [lemma, topicId]);

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

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isAuthenticated) {
          setError(t('submit.loginRequired'));
          return;
        }
        setError(undefined);
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await createSubmissionAction(fd);
          if (res.loginRequired) setError(t('submit.loginRequired'));
          else if (res.error) setError(res.error);
          else setResult(res);
        });
      }}
    >
      {error && <FormAlert tone="error">{error}</FormAlert>}

      <Field label={t('submit.lemma')} required>
        <Input
          name="proposedLemma"
          required
          maxLength={120}
          value={lemma}
          onChange={(e) => setLemma(e.target.value)}
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

      <Field label={t('submit.definition')} required>
        <Textarea name="proposedDefinition" required maxLength={2000} />
      </Field>

      <Field label={t('submit.example')}>
        <Input name="exampleSentence" maxLength={2000} />
      </Field>

      <Field label={t('submit.topic')}>
        <select name="topicId" className={selectCls} value={topicId} onChange={(e) => setTopicId(e.target.value)}>
          <option value="">{t('submit.selectTopic')}</option>
          {topicOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {' '.repeat(o.depth * 2)}
              {o.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('submit.level')}>
          <select name="levelId" className={selectCls} defaultValue="">
            <option value="">{t('submit.none')}</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('submit.age')}>
          <select name="ageGroupId" className={selectCls} defaultValue="">
            <option value="">{t('submit.none')}</option>
            {ageGroups.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {isAuthenticated && (
        <>
          <Field label={t('submit.media')}>
            <input
              name="file"
              type="file"
              accept="video/mp4,video/webm,image/png,image/jpeg"
              className="block w-full text-sm text-fg file:mr-3 file:min-h-touch file:rounded-md file:border-0 file:bg-surface-muted file:px-4 file:text-fg"
            />
          </Field>
          <label className="flex items-start gap-2 text-sm text-fg">
            <input name="consent" type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-primary" />
            <span>{t('submit.consent')}</span>
          </label>
        </>
      )}

      <Button type="submit" block loading={pending}>
        {isAuthenticated ? t('submit.button') : t('submit.loginToSubmit')}
      </Button>
    </form>
  );
}
