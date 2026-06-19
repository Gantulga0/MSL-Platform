import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { AlphabetGame } from '@/components/games/AlphabetGame';

export const metadata: Metadata = { title: translate('game.alphabet.title') };

export default function GamePage(): React.ReactElement {
  return (
    <main id="main" className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {translate('game.alphabet.title')}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-base text-fg-muted">
          {translate('game.alphabet.lead')}
        </p>
      </header>

      <AlphabetGame />
    </main>
  );
}
