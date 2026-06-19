'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, CardBody, Field, Input } from '@msl/ui';
import { translate as t } from '@/i18n';
import { FormAlert } from '@/components/auth/FormAlert';
import { bulkImportWordsAction, type BulkImportResult } from '@/lib/admin/word-actions';
import type { TopicNode } from '@/lib/dictionary/types';
import { TopicSelect } from '@/components/dictionary/TopicSelect';

const selectCls = 'h-control-sm w-full rounded-md border border-border-strong bg-bg px-3 text-base text-fg';

interface Row {
  file: File;
  lemma: string;
  topicId: string;
}

/** Flatten the topic tree into an id → slug lookup (the API matches by slug). */
function topicSlugMap(nodes: TopicNode[], acc: Map<string, string> = new Map()): Map<string, string> {
  for (const n of nodes) {
    acc.set(n.id, n.slug);
    topicSlugMap(n.children, acc);
  }
  return acc;
}

/** Derive a starting lemma from a filename: drop the extension, tidy separators. */
function lemmaFromName(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

/**
 * Bulk word import: pick many sign videos at once, tweak each word's lemma/topic,
 * then upload them all to object storage (R2) in one go. Lives alongside the
 * single-word create form in the admin Word manager.
 */
export function BulkWordImport({ topics }: { topics: TopicNode[] }): React.ReactElement {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<'pending' | 'approved'>('approved');
  const [defaultTopicId, setDefaultTopicId] = useState('');
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<BulkImportResult>();
  const [pending, start] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const slugs = topicSlugMap(topics);

  function onPick(files: FileList | null): void {
    setError(undefined);
    setResult(undefined);
    if (!files) return;
    setRows(
      Array.from(files)
        .filter((f) => f.size > 0)
        .map<Row>((file) => ({ file, lemma: lemmaFromName(file.name), topicId: defaultTopicId })),
    );
  }

  function updateRow(i: number, patch: Partial<Row>): void {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function applyTopicToAll(id: string): void {
    setDefaultTopicId(id);
    setRows((rs) => rs.map((r) => ({ ...r, topicId: id })));
  }

  function submit(): void {
    setError(undefined);
    setResult(undefined);
    if (rows.length === 0) {
      setError(t('admin.bulk.noFiles'));
      return;
    }
    if (rows.some((r) => !r.lemma.trim() || !r.topicId)) {
      setError(t('admin.bulk.rowsIncomplete'));
      return;
    }

    const fd = new FormData();
    for (const r of rows) fd.append('files', r.file);
    fd.set(
      'manifest',
      JSON.stringify(
        rows.map((r) => ({ lemma: r.lemma.trim(), topicSlug: slugs.get(r.topicId) ?? '', file: r.file.name })),
      ),
    );
    fd.set('status', status);

    start(async () => {
      const res = await bulkImportWordsAction(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      setResult(res);
      setRows([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    });
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-fg">{t('admin.bulk.title')}</h2>
          <p className="mt-1 text-sm text-fg-muted">{t('admin.bulk.hint')}</p>
        </div>

        {error && <FormAlert tone="error">{error}</FormAlert>}
        {result && (
          <FormAlert tone={result.success ? 'success' : 'error'}>
            <span className="inline-flex flex-wrap items-center gap-2">
              <Badge tone="success">{t('admin.bulk.done')}</Badge>
              {t('admin.bulk.summary')
                .replace('{success}', String(result.success ?? 0))
                .replace('{total}', String(result.total ?? 0))}
            </span>
            {result.errors?.length ? (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">
                {result.errors.map((e) => (
                  <li key={e.row}>
                    {t('admin.bulk.rowError').replace('{row}', String(e.row)).replace('{reason}', e.reason)}
                  </li>
                ))}
              </ul>
            ) : null}
          </FormAlert>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('admin.bulk.files')}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/mp4,video/webm"
              onChange={(e) => onPick(e.target.files)}
              className="block w-full text-sm text-fg file:mr-3 file:min-h-touch file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:font-medium file:text-fg-on-primary hover:file:bg-primary/90"
            />
          </Field>
          <Field label={t('admin.bulk.status')}>
            <select
              className={selectCls}
              value={status}
              onChange={(e) => setStatus(e.target.value === 'approved' ? 'approved' : 'pending')}
            >
              <option value="approved">{t('admin.bulk.statusApproved')}</option>
              <option value="pending">{t('admin.bulk.statusPending')}</option>
            </select>
          </Field>
          {rows.length > 0 && (
            <div className="sm:col-span-2">
              <Field label={t('admin.bulk.applyTopic')}>
                <TopicSelect
                  topics={topics}
                  value={defaultTopicId}
                  onChange={applyTopicToAll}
                  ariaLabel={t('admin.bulk.applyTopic')}
                  placeholder={t('submit.selectTopic')}
                />
              </Field>
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-fg">
              {t('admin.bulk.rowsHeading').replace('{n}', String(rows.length))}
            </p>
            <ul className="space-y-2">
              {rows.map((r, i) => (
                <li
                  key={`${r.file.name}-${i}`}
                  className="grid gap-2 rounded-md border border-border bg-surface p-3 sm:grid-cols-[1fr_1fr_1.5fr] sm:items-center"
                >
                  <span className="truncate text-xs text-fg-subtle" title={r.file.name}>
                    {r.file.name}
                  </span>
                  <Input
                    value={r.lemma}
                    maxLength={120}
                    aria-label={t('submit.lemma')}
                    onChange={(e) => updateRow(i, { lemma: e.target.value })}
                  />
                  <TopicSelect
                    topics={topics}
                    value={r.topicId}
                    onChange={(id) => updateRow(i, { topicId: id })}
                    ariaLabel={t('submit.topic')}
                    placeholder={t('submit.selectTopic')}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <Button type="button" onClick={submit} loading={pending} disabled={rows.length === 0}>
            {t('admin.bulk.submit').replace('{n}', String(rows.length))}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
