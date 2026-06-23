import type { Metadata } from 'next';
import type { Paginated } from '@msl/types';
import { getServerT } from '@/i18n/server';
import { apiGetSafe, TAXONOMY_READ } from '@/lib/api/server';
import { WordManager, type WordRow } from '@/components/admin/WordManager';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';

export const metadata: Metadata = { title: 'Үгс' };

export default async function AdminWordsPage(): Promise<React.ReactElement> {
  const t = await getServerT();
  const [wordsRes, topics, levels, ageGroups, handednesses] = await Promise.all([
    apiGetSafe<Paginated<WordRow>>('/admin/words?limit=50'),
    apiGetSafe<TopicNode[]>('/topics', TAXONOMY_READ),
    apiGetSafe<TaxoRef[]>('/levels', TAXONOMY_READ),
    apiGetSafe<TaxoRef[]>('/age-groups', TAXONOMY_READ),
    apiGetSafe<TaxoRef[]>('/handedness', TAXONOMY_READ),
  ]);

  return (
    <main id="main" className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg">{t('admin.words.title')}</h1>
      <WordManager
        words={wordsRes?.data ?? []}
        topics={topics ?? []}
        levels={levels ?? []}
        ageGroups={ageGroups ?? []}
        handednesses={handednesses ?? []}
      />
    </main>
  );
}
