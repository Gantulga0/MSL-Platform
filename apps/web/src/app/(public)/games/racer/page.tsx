import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getServerT } from '@/i18n/server';
import { Racer } from '@/components/games/Racer';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('game.hub.racerTitle') };
}

export default async function RacerPage(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <header className="mb-6 text-center sm:mb-8">
        <span className="eyebrow justify-center">{t('game.race.eyebrow')}</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          {t('game.hub.racerTitle')}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-fg-muted">{t('game.hub.racerDesc')}</p>
      </header>
      {/* Racer reads ?room= via useSearchParams → needs a Suspense boundary. */}
      <Suspense fallback={null}>
        <Racer />
      </Suspense>
    </main>
  );
}
