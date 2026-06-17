'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Button, Field, Textarea } from '@msl/ui';
import { translate as t } from '@/i18n';
import { FormAlert } from '@/components/auth/FormAlert';
import { approveAction, editAction, rejectAction } from '@/lib/review/actions';
import { ImagePicker, type PickerOption } from '@/components/admin/ImagePicker';
import { TopicSelect } from '@/components/dictionary/TopicSelect';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';

interface Props {
  submissionId: string;
  topics: TopicNode[];
  levels: TaxoRef[];
  ageGroups: TaxoRef[];
  handednesses: TaxoRef[];
  defaultTopicId?: string;
  defaultLevelId?: string;
  defaultAgeGroupId?: string;
  defaultHandCount?: number | null;
}

const selectCls = 'h-control-sm w-full rounded-md border border-border-strong bg-bg px-3 text-base text-fg';

/**
 * Admin approve / reject. Approval requires a classification — topic
 * (hierarchical), age, level and hand count — the API enforces the same.
 */
export function ReviewDecision({
  submissionId,
  topics,
  levels,
  ageGroups,
  handednesses,
  defaultTopicId = '',
  defaultLevelId = '',
  defaultAgeGroupId = '',
  defaultHandCount = null,
}: Props): React.ReactElement {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const handCountOptions: PickerOption[] = handednesses.map((h) => ({
    id: String(h.handCount ?? ''),
    label: h.label ?? '',
    imageUrl: h.imageUrl,
  }));

  function approve(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(undefined);
    const fd = new FormData(e.currentTarget);
    // The hand-count picker isn't natively `required`; verify it here too.
    const needed = ['topicId', 'ageGroupId', 'levelId', 'handCount'];
    const missing = needed.some((k) => !fd.get(k));
    if (missing) {
      setError(t('review.attrsRequired'));
      return;
    }
    start(async () => {
      const res = await approveAction(fd);
      if (res?.error) setError(res.error);
      else router.push('/admin/submissions' as Route);
    });
  }

  /** Save edits to the submission without approving it (the "Засах" action). */
  function save(): void {
    setError(undefined);
    setSaved(false);
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    start(async () => {
      const res = await editAction(fd);
      if (res?.error) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  function reject(): void {
    setError(undefined);
    const form = formRef.current;
    const fd = new FormData();
    fd.set('id', submissionId);
    fd.set('comment', form ? String(new FormData(form).get('comment') ?? '') : '');
    start(async () => {
      const res = await rejectAction(fd);
      if (res?.error) setError(res.error);
      else router.push('/admin/submissions' as Route);
    });
  }

  return (
    <form ref={formRef} onSubmit={approve} className="space-y-4">
      {error && <FormAlert tone="error">{error}</FormAlert>}
      {saved && !error && <FormAlert tone="success">{t('review.saved')}</FormAlert>}
      <input type="hidden" name="id" value={submissionId} />

      <Field label={t('review.topic')} required>
        <TopicSelect
          name="topicId"
          topics={topics}
          defaultValue={defaultTopicId}
          required
          ariaLabel={t('review.topic')}
          placeholder={t('submit.selectTopic')}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('submit.age')} required>
          <select name="ageGroupId" className={selectCls} required defaultValue={defaultAgeGroupId}>
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
        <Field label={t('submit.level')} required>
          <select name="levelId" className={selectCls} required defaultValue={defaultLevelId}>
            <option value="" disabled>
              {t('submit.none')}
            </option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">{t('dict.hands')}</legend>
        <ImagePicker
          name="handCount"
          options={handCountOptions}
          columns={2}
          imageOnly
          defaultSelected={defaultHandCount ? [String(defaultHandCount)] : []}
        />
      </fieldset>

      <Field label={t('review.comment')}>
        <Textarea name="comment" maxLength={1000} />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending}>
          {t('review.approve')}
        </Button>
        <Button type="button" variant="secondary" onClick={save} loading={pending}>
          {t('review.save')}
        </Button>
        <Button type="button" variant="danger" onClick={reject} loading={pending}>
          {t('review.reject')}
        </Button>
      </div>
    </form>
  );
}
