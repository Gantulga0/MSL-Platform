import type { Metadata } from 'next';
import { getServerT } from '@/i18n/server';
import { CATEGORIES, SIGNS } from '@/lib/signs/numbers';
import { NumbersExplorer } from '@/components/signs/NumbersExplorer';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('numbers.title') };
}

export default async function NumbersPage(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main id="main" className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <header className="mb-8 text-center">
        <span className="eyebrow justify-center">{t('nav.learn')}</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          {t('numbers.title')}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-fg-muted">{t('numbers.lead')}</p>
      </header>
      <NumbersExplorer categories={CATEGORIES} signs={SIGNS} />
    </main>
  );
}
