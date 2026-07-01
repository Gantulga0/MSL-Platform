import type { Metadata } from 'next';
import { getServerT } from '@/i18n/server';
import { AlphabetGame } from '@/components/games/AlphabetGame';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('game.alphabet.title') };
}

export default async function FruitNinjaPage(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <header className="mb-6 text-center sm:mb-8">
        <span className="eyebrow justify-center">{t('game.hub.eyebrow')}</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          {t('game.alphabet.title')}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-fg-muted">{t('game.alphabet.lead')}</p>
      </header>

      {/* How to play */}
      <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-3">
        {(['game.alphabet.how1', 'game.alphabet.how2', 'game.alphabet.how3'] as const).map(
          (key, i) => (
            <div key={key} className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-content-center rounded-full bg-accent-subtle text-xs font-bold text-accent-ink">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-fg-muted">{t(key)}</p>
            </div>
          ),
        )}
      </div>

      <AlphabetGame />
    </main>
  );
}
