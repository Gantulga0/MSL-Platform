import type { Metadata } from 'next';
import type { Paginated } from '@msl/types';
import { getServerT } from '@/i18n/server';
import { apiGetSafe } from '@/lib/api/server';
import { QueueTable, type QueueItem } from '@/components/review/QueueTable';

export const metadata: Metadata = { title: 'Санал хянах' };

export default async function AdminSubmissionsPage(): Promise<React.ReactElement> {
  const t = await getServerT();
  const queue = await apiGetSafe<Paginated<QueueItem>>('/admin/submissions?status=pending&limit=50');

  return (
    <main id="main" className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg">{t('review.title')}</h1>
      <QueueTable items={queue?.data ?? []} />
    </main>
  );
}
