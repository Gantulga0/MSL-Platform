import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import type { Paginated } from '@msl/types';
import { Badge, Card, CardBody, EmptyState, type BadgeTone } from '@msl/ui';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Миний профайл' };

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

export default async function ProfilePage(): Promise<React.ReactElement> {
  const session = await getSession();
  if (session.role === 'guest') {
    return (
      <main id="main" className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-fg-muted">{translate('profile.loginRequired')}</p>
        <Link href={'/login' as Route} className="mt-4 inline-block text-primary underline">
          {translate('nav.login')}
        </Link>
      </main>
    );
  }

  const data = await apiGetSafe<Paginated<MineItem>>('/submissions/mine?limit=50');
  const items = data?.data ?? [];

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-fg">{translate('nav.profile')}</h1>
        <p className="mt-1 text-fg-muted">
          {session.displayName}
          {session.email ? ` · ${session.email}` : session.username ? ` · @${session.username}` : ''}
        </p>
        {session.role === 'admin' && (
          <Link href={'/admin' as Route} className="mt-2 inline-block text-sm text-primary underline">
            {translate('nav.adminDashboard')}
          </Link>
        )}
      </header>

      <section aria-labelledby="my-subs-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="my-subs-heading" className="text-lg font-semibold text-fg">
            {translate('mysub.title')}
          </h2>
          <Link href={'/submit-word' as Route} className="text-sm text-primary underline">
            {translate('nav.submitWord')}
          </Link>
        </div>

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
                          <h3 className="text-lg font-semibold text-fg">{s.proposedLemma}</h3>
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
      </section>
    </main>
  );
}
