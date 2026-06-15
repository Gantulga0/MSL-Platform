'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Badge, Button, EmptyState } from '@msl/ui';
import { translate as t } from '@/i18n';

export interface QueueItem {
  id: string;
  proposedLemma: string;
  proposedDefinition: string;
  topic: { id: string; name: string } | null;
  submitter: { displayName: string; isMinor: boolean } | null;
  _count: { duplicateChecks: number };
}

/**
 * Review queue list. Approval now requires a full classification (topic, age,
 * level, hand count, handshape, position, movement), which is only possible on
 * the detail page — so the list links there rather than offering quick-approve.
 */
export function QueueTable({ items }: { items: QueueItem[] }): React.ReactElement {
  if (items.length === 0) return <EmptyState title={t('review.empty')} />;

  return (
    <ul className="space-y-2">
      {items.map((s) => (
        <li
          key={s.id}
          className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3"
        >
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
          <Link href={`/admin/submissions/${s.id}` as Route}>
            <Button size="sm">{t('review.view')}</Button>
          </Link>
        </li>
      ))}
    </ul>
  );
}
