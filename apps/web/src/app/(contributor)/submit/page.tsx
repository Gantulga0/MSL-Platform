import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';
import { SubmitForm } from '@/components/submissions/SubmitForm';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';

export const metadata: Metadata = { title: 'Үг илгээх' };

export default async function SubmitPage(): Promise<React.ReactElement> {
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
      <SubmitForm topics={topics ?? []} levels={levels ?? []} ageGroups={ageGroups ?? []} />
    </main>
  );
}
