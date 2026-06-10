import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';
import { SubmitForm } from '@/components/submissions/SubmitForm';
import { AuthTrigger } from '@/components/auth/AuthTrigger';
import { getSession } from '@/lib/auth/session';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';

export const metadata: Metadata = { title: 'Үг санал болгох' };

export default async function SubmitWordPage(): Promise<React.ReactElement> {
  const session = await getSession();
  const [topics, levels, ageGroups] = await Promise.all([
    apiGetSafe<TopicNode[]>('/topics'),
    apiGetSafe<TaxoRef[]>('/levels'),
    apiGetSafe<TaxoRef[]>('/age-groups'),
  ]);

  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg">{translate('submit.title')}</h1>
        <p className="mt-1 text-fg-muted">{translate('submit.subtitle')}</p>
      </header>

      {session.role === 'guest' ? (
        <p className="mb-4 rounded-md border border-border bg-surface-muted p-3 text-sm text-fg">
          {translate('submit.guestHint')}{' '}
          <AuthTrigger view="login" className="font-medium text-primary underline">
            {translate('nav.login')}
          </AuthTrigger>
          {' · '}
          <AuthTrigger view="register" className="font-medium text-primary underline">
            {translate('nav.register')}
          </AuthTrigger>
        </p>
      ) : null}

      <SubmitForm
        topics={topics ?? []}
        levels={levels ?? []}
        ageGroups={ageGroups ?? []}
        isAuthenticated={session.role !== 'guest'}
      />
    </main>
  );
}
