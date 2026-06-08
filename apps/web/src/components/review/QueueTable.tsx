'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Badge, Button, EmptyState } from '@msl/ui';
import { translate as t } from '@/i18n';
import { approveAction, batchApproveAction } from '@/lib/review/actions';

export interface QueueItem {
  id: string;
  proposedLemma: string;
  proposedDefinition: string;
  topic: { id: string; name: string } | null;
  submitter: { displayName: string; isMinor: boolean } | null;
  _count: { duplicateChecks: number };
}

export function QueueTable({ items }: { items: QueueItem[] }): React.ReactElement {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  if (items.length === 0) return <EmptyState title={t('review.empty')} />;

  function toggle(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function approveOne(id: string): void {
    const fd = new FormData();
    fd.set('id', id);
    start(async () => {
      await approveAction(fd);
      router.refresh();
    });
  }

  function approveSelected(): void {
    start(async () => {
      await batchApproveAction([...selected]);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-fg-muted">{selected.size}</span>
        <Button size="sm" onClick={approveSelected} loading={pending} disabled={selected.size === 0}>
          {t('review.batchApprove')}
        </Button>
      </div>
      <ul className="space-y-2">
        {items.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3"
          >
            <input
              type="checkbox"
              aria-label={s.proposedLemma}
              className="h-5 w-5 accent-primary"
              checked={selected.has(s.id)}
              onChange={() => toggle(s.id)}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-fg">{s.proposedLemma}</span>
                {s._count.duplicateChecks > 0 && <Badge tone="warning">{t('review.dupFlag')}</Badge>}
              </div>
              <p className="truncate text-sm text-fg-muted">{s.proposedDefinition}</p>
              <p className="text-xs text-fg-subtle">
                {s.topic?.name} · {s.submitter?.displayName}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/review/${s.id}` as Route}>
                <Button size="sm" variant="secondary">
                  {t('review.view')}
                </Button>
              </Link>
              <Button size="sm" onClick={() => approveOne(s.id)} loading={pending}>
                {t('review.approve')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
