import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import type { Paginated } from '@msl/types';
import { Badge, Card, CardBody, EmptyState, type BadgeTone } from '@msl/ui';
import { getServerT } from '@/i18n/server';
import { apiGetSafe } from '@/lib/api/server';
import { AuthTrigger } from '@/components/auth/AuthTrigger';
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
  const t = await getServerT();
  const session = await getSession();
  if (session.role === 'guest') {
    return (
      <main id="main" className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-fg-muted">{t('profile.loginRequired')}</p>
        <AuthTrigger view="login" className="mt-4 inline-block text-primary underline">
          {t('nav.login')}
        </AuthTrigger>
      </main>
    );
  }

  const data = await apiGetSafe<Paginated<MineItem>>('/submissions/mine?limit=50');
  const items = data?.data ?? [];

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('nav.profile')}</h1>
        <p className="mt-1 text-fg-muted">
          {session.displayName}
          {session.email ? ` · ${session.email}` : session.username ? ` · @${session.username}` : ''}
        </p>
        {session.role === 'admin' && (
          <Link href={'/admin' as Route} className="mt-2 inline-block text-sm text-primary underline">
            {t('nav.adminDashboard')}
          </Link>
        )}
      </header>

      <section aria-labelledby="my-subs-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="my-subs-heading" className="text-lg font-semibold text-fg">
            {t('mysub.title')}
          </h2>
          <Link href={'/submit-word' as Route} className="text-sm text-primary underline">
            {t('nav.submitWord')}
          </Link>
        </div>

        {items.length === 0 ? (
          <EmptyState title={t('mysub.empty')} />
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
                          {t(`mysub.status.${s.status}`)}
                        </Badge>
                      </div>
                      {comment && (
                        <p className="mt-3 rounded-md bg-surface-muted p-2 text-sm text-fg">
                          <span className="font-medium">{t('mysub.comment')}</span> {comment}
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
