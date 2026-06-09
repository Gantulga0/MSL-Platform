import type { Metadata } from 'next';
import type { Paginated } from '@msl/types';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';
import { WordManager, type WordRow } from '@/components/admin/WordManager';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';

export const metadata: Metadata = { title: 'Үгс' };

export default async function AdminWordsPage(): Promise<React.ReactElement> {
  const [wordsRes, topics, levels] = await Promise.all([
    apiGetSafe<Paginated<WordRow>>('/admin/words?limit=50'),
    apiGetSafe<TopicNode[]>('/topics'),
    apiGetSafe<TaxoRef[]>('/levels'),
  ]);

  return (
    <main id="main" className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg">{translate('admin.words.title')}</h1>
      <WordManager
        words={wordsRes?.data ?? []}
        topics={topics ?? []}
        levels={levels ?? []}
      />
    </main>
  );
}
