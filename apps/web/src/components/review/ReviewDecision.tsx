'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Button, Field, Textarea } from '@msl/ui';
import { translate as t } from '@/i18n';
import { FormAlert } from '@/components/auth/FormAlert';
import { approveAction, rejectAction } from '@/lib/review/actions';
import type { TopicNode } from '@/lib/dictionary/types';

function flatten(nodes: TopicNode[], depth = 0): { id: string; name: string; depth: number }[] {
  return nodes.flatMap((n) => [{ id: n.id, name: n.name, depth }, ...flatten(n.children, depth + 1)]);
}

interface Props {
  submissionId: string;
  needsTopic: boolean;
  topics: TopicNode[];
}

/** Admin approve / reject with optional topic override. */
export function ReviewDecision({ submissionId, needsTopic, topics }: Props): React.ReactElement {
  const router = useRouter();
  const topicOptions = flatten(topics);
  const [comment, setComment] = useState('');
  const [topicId, setTopicId] = useState('');
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  function run(action: (fd: FormData) => Promise<{ error?: string }>): void {
    setError(undefined);
    const fd = new FormData();
    fd.set('id', submissionId);
    fd.set('comment', comment);
    if (topicId) fd.set('topicId', topicId);
    start(async () => {
      const res = await action(fd);
      if (res?.error) setError(res.error);
      else router.push('/admin/submissions' as Route);
    });
  }

  return (
    <div className="space-y-4">
      {error && <FormAlert tone="error">{error}</FormAlert>}
      {needsTopic && (
        <Field label={t('review.topic')} required>
          <select
            className="h-control-sm w-full rounded-md border border-border-strong bg-bg px-3 text-base text-fg"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
          >
            <option value="">—</option>
            {topicOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {' '.repeat(o.depth * 2)}
                {o.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label={t('review.comment')}>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => run(approveAction)} loading={pending}>
          {t('review.approve')}
        </Button>
        <Button variant="danger" onClick={() => run(rejectAction)} loading={pending}>
          {t('review.reject')}
        </Button>
      </div>
    </div>
  );
}
