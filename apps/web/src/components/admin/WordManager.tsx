'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, CardBody, Field, Input, Textarea, type BadgeTone } from '@msl/ui';
import { translate as t } from '@/i18n';
import { FormAlert } from '@/components/auth/FormAlert';
import { createWordAction, deleteWordAction, updateWordAction } from '@/lib/admin/word-actions';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';

export interface WordRow {
  id: string;
  lemma: string;
  definition: string;
  exampleSentence: string | null;
  status: string;
  viewCount: number;
  topic: { id: string; name: string } | null;
}

const STATUS_TONE: Record<string, BadgeTone> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  draft: 'neutral',
  archived: 'neutral',
};

const STATUSES = ['approved', 'pending', 'draft', 'rejected', 'archived'] as const;

function flatten(nodes: TopicNode[], depth = 0): { id: string; name: string; depth: number }[] {
  return nodes.flatMap((n) => [
    { id: n.id, name: n.name, depth },
    ...flatten(n.children, depth + 1),
  ]);
}

const selectCls = 'h-control-sm w-full rounded-md border border-border-strong bg-bg px-3 text-base text-fg';

export function WordManager({
  words,
  topics,
  levels,
  ageGroups,
  handshapes,
}: {
  words: WordRow[];
  topics: TopicNode[];
  levels: TaxoRef[];
  ageGroups: TaxoRef[];
  handshapes: TaxoRef[];
}): React.ReactElement {
  const router = useRouter();
  const topicOptions = flatten(topics);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-lg font-semibold text-fg">{t('admin.words.create')}</h2>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              setError(undefined);
              const fd = new FormData(e.currentTarget);
              start(async () => {
                const res = await createWordAction(fd);
                if (res.error) setError(res.error);
                else {
                  e.currentTarget.reset();
                  router.refresh();
                }
              });
            }}
          >
            {error && (
              <div className="sm:col-span-2">
                <FormAlert tone="error">{error}</FormAlert>
              </div>
            )}
            <Field label={t('submit.lemma')} required>
              <Input name="lemma" required maxLength={120} />
            </Field>
            <Field label={t('submit.topic')} required>
              <select name="topicId" className={selectCls} required defaultValue="">
                <option value="" disabled>
                  {t('submit.selectTopic')}
                </option>
                {topicOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {' '.repeat(o.depth * 2)}
                    {o.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('submit.definition')} required>
              <Textarea name="definition" required maxLength={2000} />
            </Field>
            <Field label={t('submit.example')}>
              <Input name="exampleSentence" maxLength={2000} />
            </Field>
            <Field label={t('submit.age')} required>
              <select name="ageGroupId" className={selectCls} required defaultValue="">
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
            <Field label={t('dict.hands')}>
              <select name="handCount" className={selectCls} defaultValue="">
                <option value="">{t('submit.none')}</option>
                <option value="1">{t('dict.handsOne')}</option>
                <option value="2">{t('dict.handsTwo')}</option>
              </select>
            </Field>
            <Field label={t('dict.handshape')}>
              <select name="handshapeId" className={selectCls} defaultValue="">
                <option value="">{t('submit.none')}</option>
                {handshapes.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={pending}>
                {t('admin.words.create')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-fg">{t('admin.words.list')}</h2>
        {words.length === 0 ? (
          <p className="text-fg-muted">{t('admin.words.empty')}</p>
        ) : (
          <ul className="space-y-3">
            {words.map((w) => (
              <li key={w.id}>
                <Card>
                  <CardBody className="space-y-3">
                    {editingId === w.id ? (
                      <form
                        className="grid gap-3 sm:grid-cols-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          start(async () => {
                            const res = await updateWordAction(fd);
                            if (!res.error) {
                              setEditingId(null);
                              router.refresh();
                            }
                          });
                        }}
                      >
                        <input type="hidden" name="id" value={w.id} />
                        <Field label={t('submit.lemma')}>
                          <Input name="lemma" defaultValue={w.lemma} maxLength={120} />
                        </Field>
                        <Field label={t('admin.words.status')}>
                          <select name="status" className={selectCls} defaultValue={w.status}>
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label={t('submit.definition')}>
                          <Textarea name="definition" defaultValue={w.definition} maxLength={2000} />
                        </Field>
                        <div className="flex gap-2 sm:col-span-2">
                          <Button type="submit" size="sm" loading={pending}>
                            {t('admin.words.save')}
                          </Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                            {t('admin.words.cancel')}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/dictionary/${w.id}` as Route}
                              className="text-lg font-semibold text-primary underline"
                            >
                              {w.lemma}
                            </Link>
                            <Badge tone={STATUS_TONE[w.status] ?? 'neutral'}>{w.status}</Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{w.definition}</p>
                          <p className="mt-1 text-xs text-fg-subtle">
                            {w.topic?.name ?? '—'} · {w.viewCount} {t('admin.words.views')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setEditingId(w.id)}>
                            {t('admin.words.edit')}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={pending}
                            onClick={() =>
                              start(async () => {
                                await deleteWordAction(w.id);
                                router.refresh();
                              })
                            }
                          >
                            {t('admin.words.delete')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
