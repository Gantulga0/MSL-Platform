import type { Metadata } from 'next';
import type { Paginated } from '@msl/types';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';
import { NotificationList } from '@/components/notifications/NotificationList';
import type { NotificationItem } from '@/lib/notifications/actions';

export const metadata: Metadata = { title: 'Мэдэгдэл' };

export default async function AdminNotificationsPage(): Promise<React.ReactElement> {
  const notifications = await apiGetSafe<Paginated<NotificationItem>>('/notifications?limit=50');

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg">
        {translate('notif.title')}
      </h1>
      <NotificationList items={notifications?.data ?? []} />
    </main>
  );
}
