import type { Metadata } from 'next';
import type { Paginated } from '@msl/types';
import { Badge, Card, CardBody, EmptyState, type BadgeTone } from '@msl/ui';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';

export const metadata: Metadata = { title: 'Миний илгээсэн' };

interface MineItem {
  id: string;
  proposedLemma: string;
  proposedDefinition: string;
  status: string;
  createdAt: string;
  topic: { id: string; name: string } | null;
  reviews: { action: string; comment: string | null; createdAt: string }[];
}

const TONE: Record<string, BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  needs_clarification: 'info',
  duplicate: 'neutral',
};

export default async function MySubmissionsPage(): Promise<React.ReactElement> {
  const data = await apiGetSafe<Paginated<MineItem>>('/submissions/mine?limit=50');
  const items = data?.data ?? [];

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg">{translate('mysub.title')}</h1>

      {items.length === 0 ? (
        <EmptyState title={translate('mysub.empty')} />
      ) : (
        <ul className="space-y-3">
          {items.map((s) => {
            const comment = s.reviews[0]?.comment;
            return (
              <li key={s.id}>
                <Card>
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-fg">{s.proposedLemma}</h2>
                        <p className="mt-1 line-clamp-2 text-fg-muted">{s.proposedDefinition}</p>
                        {s.topic && <p className="mt-1 text-sm text-fg-subtle">{s.topic.name}</p>}
                      </div>
                      <Badge tone={TONE[s.status] ?? 'neutral'}>
                        {translate(`mysub.status.${s.status}`)}
                      </Badge>
                    </div>
                    {comment && (
                      <p className="mt-3 rounded-md bg-surface-muted p-2 text-sm text-fg">
                        <span className="font-medium">{translate('mysub.comment')}</span> {comment}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
