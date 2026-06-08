'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Card, CardBody, CardTitle, Field, Input } from '@msl/ui';
import { translate as t } from '@/i18n';
import { FormAlert } from '@/components/auth/FormAlert';
import {
  createAgeGroupAction,
  createLevelAction,
  createTopicAction,
  deleteTopicAction,
  type ActionResult,
} from '@/lib/admin/taxonomy-actions';

export interface TopicNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children: TopicNode[];
}
export interface Level {
  id: string;
  code: string;
  label: string;
}
export interface AgeGroup {
  id: string;
  code: string;
  label: string;
  minAge: number | null;
  maxAge: number | null;
}

interface Props {
  topics: TopicNode[];
  levels: Level[];
  ageGroups: AgeGroup[];
}

function flatten(nodes: TopicNode[], depth = 0): { id: string; name: string; depth: number }[] {
  return nodes.flatMap((n) => [
    { id: n.id, name: n.name, depth },
    ...flatten(n.children, depth + 1),
  ]);
}

/** Generic form wrapper handling the server action + error state. */
function ActionForm({
  action,
  submitLabel,
  children,
}: {
  action: (fd: FormData) => Promise<ActionResult>;
  submitLabel: string;
  children: React.ReactNode;
}): React.ReactElement {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        const fd = new FormData(e.currentTarget);
        const form = e.currentTarget;
        start(async () => {
          const res = await action(fd);
          if (res?.error) setError(res.error);
          else form.reset();
        });
      }}
    >
      {error && <FormAlert tone="error">{error}</FormAlert>}
      {children}
      <Button type="submit" size="sm" loading={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}

function TopicRows({ nodes, depth = 0 }: { nodes: TopicNode[]; depth?: number }): React.ReactElement {
  const [, start] = useTransition();
  return (
    <ul className="space-y-1">
      {nodes.map((n) => (
        <li key={n.id}>
          <div
            className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-surface-muted"
            style={{ paddingInlineStart: `${depth * 1.25 + 0.5}rem` }}
          >
            <span className="text-fg">
              {n.name} <span className="text-fg-subtle">· {n.slug}</span>
            </span>
            <form
              action={(fd) => {
                start(() => {
                  void deleteTopicAction(fd);
                });
              }}
            >
              <input type="hidden" name="id" value={n.id} />
              <Button type="submit" size="sm" variant="ghost" aria-label={`${t('admin.tax.delete')}: ${n.name}`}>
                <Trash2 aria-hidden className="h-4 w-4 text-danger" />
              </Button>
            </form>
          </div>
          {n.children.length > 0 && <TopicRows nodes={n.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

export function TaxonomyManager({ topics, levels, ageGroups }: Props): React.ReactElement {
  const parentOptions = flatten(topics);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Topics */}
      <Card className="md:col-span-2">
        <CardBody className="space-y-4">
          <CardTitle>{t('admin.tax.topics')}</CardTitle>
          {topics.length === 0 ? (
            <p className="text-fg-muted">{t('admin.tax.empty')}</p>
          ) : (
            <TopicRows nodes={topics} />
          )}
          <ActionForm action={createTopicAction} submitLabel={t('admin.tax.addTopic')}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={t('admin.tax.name')} required>
                <Input name="name" required maxLength={120} />
              </Field>
              <Field label={t('admin.tax.slug')} required>
                <Input name="slug" required pattern="[a-z0-9-]+" />
              </Field>
              <Field label={t('admin.tax.parent')}>
                <select
                  name="parentId"
                  className="h-control-sm w-full rounded-md border border-border-strong bg-bg px-3 text-base text-fg"
                >
                  <option value="">{t('admin.tax.rootLevel')}</option>
                  {parentOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {' '.repeat(o.depth * 2)}
                      {o.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </ActionForm>
        </CardBody>
      </Card>

      {/* Levels */}
      <Card>
        <CardBody className="space-y-4">
          <CardTitle>{t('admin.tax.levels')}</CardTitle>
          <ul className="space-y-1 text-fg">
            {levels.map((l) => (
              <li key={l.id}>
                {l.label} <span className="text-fg-subtle">· {l.code}</span>
              </li>
            ))}
          </ul>
          <ActionForm action={createLevelAction} submitLabel={t('admin.tax.addLevel')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('admin.tax.code')} required>
                <Input name="code" required />
              </Field>
              <Field label={t('admin.tax.label')} required>
                <Input name="label" required />
              </Field>
            </div>
          </ActionForm>
        </CardBody>
      </Card>

      {/* Age groups */}
      <Card>
        <CardBody className="space-y-4">
          <CardTitle>{t('admin.tax.ageGroups')}</CardTitle>
          <ul className="space-y-1 text-fg">
            {ageGroups.map((a) => (
              <li key={a.id}>
                {a.label} <span className="text-fg-subtle">· {a.code}</span>
              </li>
            ))}
          </ul>
          <ActionForm action={createAgeGroupAction} submitLabel={t('admin.tax.addAgeGroup')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('admin.tax.code')} required>
                <Input name="code" required />
              </Field>
              <Field label={t('admin.tax.label')} required>
                <Input name="label" required />
              </Field>
              <Field label={t('admin.tax.minAge')}>
                <Input name="minAge" type="number" min={0} />
              </Field>
              <Field label={t('admin.tax.maxAge')}>
                <Input name="maxAge" type="number" min={0} />
              </Field>
            </div>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
