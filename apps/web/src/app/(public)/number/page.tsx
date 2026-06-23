import type { Metadata } from 'next';
import { getServerT } from '@/i18n/server';
import { CATEGORIES, SIGNS } from '@/lib/signs/numbers';
import { NumbersExplorer } from '@/components/signs/NumbersExplorer';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('numbers.title') };
}

export default function NumbersPage(): React.ReactElement {
  return (
    <main id="main" className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <NumbersExplorer categories={CATEGORIES} signs={SIGNS} />
    </main>
  );
}
