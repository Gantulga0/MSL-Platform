'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, CardBody, Field, Input, Textarea, type BadgeTone } from '@msl/ui';
import { useT } from '@/i18n/client';
import { FormAlert } from '@/components/auth/FormAlert';
import { createWordAction, deleteWordAction, updateWordAction } from '@/lib/admin/word-actions';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';
import { ImagePicker, type PickerOption } from './ImagePicker';
import { BulkWordImport } from './BulkWordImport';
import { TopicSelect } from '@/components/dictionary/TopicSelect';

export interface WordRow {
  id: string;
  lemma: string;
  definition: string | null;
  exampleSentence: string | null;
  status: string;
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

const selectCls ='h-control-sm w-full rounded-md border border-border-strong bg-bg px-3 text-base text-fg';

export function WordManager({
  words,
  topics,
  levels,
  ageGroups,
  handednesses,
}: {
  words: WordRow[];
  topics: TopicNode[];
  levels: TaxoRef[];
  ageGroups: TaxoRef[];
  handednesses: TaxoRef[];
}): React.ReactElement {
  const t = useT();
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  // Bumping this remounts the form so the image pickers reset after a create.
  const [formKey, setFormKey] = useState(0);

  // Handedness picker submits the mapped handCount (1/2) into `handCount`.
  const handCountOptions: PickerOption[] = handednesses.map((h) => ({
    id: String(h.handCount ?? ''),
    label: h.label ?? '',
    imageUrl: h.imageUrl,
  }));

  return (
    <div className="space-y-8">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-lg font-semibold text-fg">{t('admin.words.create')}</h2>
          <form
            key={formKey}
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              setError(undefined);
              setSuccess(false);
              const fd = new FormData(e.currentTarget);
              // Client-side required-field validation before the server round-trip.
              const lemma = String(fd.get('lemma') ?? '').trim();
              const topicId = String(fd.get('topicId') ?? '').trim();
              const ageGroupId = String(fd.get('ageGroupId') ?? '').trim();
              const video = fd.get('video');
              if (
                !lemma ||
                !topicId ||
                !ageGroupId ||
                !(video instanceof File && video.size > 0)
              ) {
                setError(t('admin.words.validationRequired'));
                return;
              }
              start(async () => {
                const res = await createWordAction(fd);
                if (res.error) setError(res.error);
                else {
                  setSuccess(true);
                  setFormKey((k) => k + 1);
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
            {success && (
              <div className="sm:col-span-2">
                <FormAlert tone="success">
                  <span className="inline-flex items-center gap-2">
                    <Badge tone="success">{t('admin.words.createdBadge')}</Badge>
                    {t('admin.words.created')}
                  </span>
                </FormAlert>
              </div>
            )}
            <Field label={t('submit.lemma')} required>
              <Input name="lemma" required maxLength={120} />
            </Field>
            <Field label={t('submit.topic')} required>
              <TopicSelect
                name="topicId"
                topics={topics}
                required
                ariaLabel={t('submit.topic')}
                placeholder={t('submit.selectTopic')}
              />
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

            <div className="sm:col-span-2">
              <Field label={t('admin.words.video')} required>
                <input
                  type="file"
                  name="video"
                  accept="video/mp4,video/webm"
                  required
                  className="block w-full text-sm text-fg file:mr-3 file:min-h-touch file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:font-medium file:text-fg-on-primary hover:file:bg-primary/90"
                />
              </Field>
            </div>

            <fieldset className="sm:col-span-2 space-y-2">
              <legend className="text-sm font-medium text-fg">{t('dict.hands')}</legend>
              <ImagePicker name="handCount" options={handCountOptions} columns={2} imageOnly />
            </fieldset>

            <div className="sm:col-span-2">
              <Button type="submit" loading={pending}>
                {t('admin.words.create')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <BulkWordImport topics={topics} />

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
                          <Textarea name="definition" defaultValue={w.definition ?? ''} maxLength={2000} />
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
                          {w.definition && (
                            <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{w.definition}</p>
                          )}
                          <p className="mt-1 text-xs text-fg-subtle">{w.topic?.name ?? '—'}</p>
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
