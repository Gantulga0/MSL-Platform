import type { Metadata } from 'next';
import { getServerT } from '@/i18n/server';
import { AlphabetGame } from '@/components/games/AlphabetGame';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('game.alphabet.title') };
}

export default async function GamePage(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main id="main" className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t('game.alphabet.title')}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-base text-fg-muted">
          {t('game.alphabet.lead')}
        </p>
      </header>

      <AlphabetGame />
    </main>
  );
}
