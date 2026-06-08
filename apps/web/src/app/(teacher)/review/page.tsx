import type { Metadata } from 'next';
import type { Paginated } from '@msl/types';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';
import { QueueTable, type QueueItem } from '@/components/review/QueueTable';

export const metadata: Metadata = { title: 'Хянах дараалал' };

export default async function ReviewQueuePage(): Promise<React.ReactElement> {
  const queue = await apiGetSafe<Paginated<QueueItem>>('/submissions?status=pending&limit=50');

  return (
    <main id="main" className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg">{translate('review.title')}</h1>
      <QueueTable items={queue?.data ?? []} />
    </main>
  );
}
