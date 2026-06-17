import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { apiGetSafe, TAXONOMY_READ } from '@/lib/api/server';
import {
  TaxonomyManager,
  type AgeGroup,
  type Level,
  type TopicNode,
} from '@/components/admin/TaxonomyManager';

export const metadata: Metadata = { title: 'Сэдэв ба ангилал' };

export default async function AdminTopicsPage(): Promise<React.ReactElement> {
  const [topics, levels, ageGroups] = await Promise.all([
    apiGetSafe<TopicNode[]>('/topics', TAXONOMY_READ),
    apiGetSafe<Level[]>('/levels', TAXONOMY_READ),
    apiGetSafe<AgeGroup[]>('/age-groups', TAXONOMY_READ),
  ]);

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg">{translate('admin.tax.title')}</h1>
        <p className="mt-1 text-fg-muted">{translate('admin.tax.subtitle')}</p>
      </header>
      <TaxonomyManager topics={topics ?? []} levels={levels ?? []} ageGroups={ageGroups ?? []} />
    </main>
  );
}
