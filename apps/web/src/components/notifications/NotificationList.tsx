'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Badge, Button, EmptyState } from '@msl/ui';
import { translate as t } from '@/i18n';
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type NotificationItem,
} from '@/lib/notifications/actions';

/** Short title per notification type. */
function titleKey(type: NotificationItem['type']): string {
  switch (type) {
    case 'review_pending':
      return 'notif.reviewPending';
    case 'approved':
      return 'notif.approved';
    case 'rejected':
      return 'notif.rejected';
    case 'clarification':
      return 'notif.clarification';
    default:
      return 'notif.system';
  }
}

/**
 * Admin notification feed. Clicking a "review pending" item marks it read and
 * opens the matching submission detail (where it can be approved or edited).
 */
export function NotificationList({ items }: { items: NotificationItem[] }): React.ReactElement {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (items.length === 0) return <EmptyState title={t('notif.empty')} />;

  function open(n: NotificationItem): void {
    setBusyId(n.id);
    start(async () => {
      await markNotificationReadAction(n.id);
      if (n.payload.submissionId) {
        router.push(`/admin/submissions/${n.payload.submissionId}` as Route);
      } else {
        router.refresh();
      }
    });
  }

  function markAll(): void {
    start(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  const hasUnread = items.some((n) => !n.readAt);

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={markAll} loading={pending && !busyId}>
            {t('notif.markAllRead')}
          </Button>
        </div>
      )}
      <ul className="space-y-2">
        {items.map((n) => {
          const unread = !n.readAt;
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => open(n)}
                disabled={pending}
                className={`flex w-full min-h-touch items-center gap-3 rounded-md border p-3 text-start transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  unread ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-fg">{t(titleKey(n.type))}</span>
                    {unread && <Badge tone="info">{t('notif.new')}</Badge>}
                  </div>
                  {n.payload.lemma && (
                    <p className="truncate text-sm text-fg-muted">{n.payload.lemma}</p>
                  )}
                </div>
                {n.payload.submissionId && (
                  <span className="shrink-0 text-sm text-primary underline">{t('review.view')}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
