import type { Metadata } from 'next';
import type { Paginated } from '@msl/types';
import { Card, CardBody } from '@msl/ui';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';

export const metadata: Metadata = { title: 'Багшийн самбар' };

async function count(status: string): Promise<number> {
  const res = await apiGetSafe<Paginated<unknown>>(`/submissions?status=${status}&limit=1`);
  return res?.meta.total ?? 0;
}

export default async function TeacherDashboardPage(): Promise<React.ReactElement> {
  const [pending, approved, rejected, duplicate] = await Promise.all([
    count('pending'),
    count('approved'),
    count('rejected'),
    count('duplicate'),
  ]);

  const kpis = [
    { label: translate('review.dashPending'), value: pending, tone: 'text-warning' },
    { label: translate('review.dashApproved'), value: approved, tone: 'text-success' },
    { label: translate('review.dashRejected'), value: rejected, tone: 'text-danger' },
    { label: translate('review.dashDuplicates'), value: duplicate, tone: 'text-fg-muted' },
  ];

  return (
    <main id="main" className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg">{translate('review.dashTitle')}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardBody>
              <p className={`text-3xl font-bold ${k.tone}`}>{k.value}</p>
              <p className="mt-1 text-sm text-fg-muted">{k.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </main>
  );
}
