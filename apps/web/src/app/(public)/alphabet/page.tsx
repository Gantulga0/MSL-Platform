import type { Metadata } from 'next';
import { getServerT } from '@/i18n/server';
import { ALPHABET } from '@/lib/signs/alphabet';
import { SignBoard } from '@/components/signs/SignBoard';
import type { SignItem } from '@/components/signs/types';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('alphabet.title') };
}

export default async function AlphabetPage(): Promise<React.ReactElement> {
  const t = await getServerT();
  const items: SignItem[] = ALPHABET.map((l) => ({
    key: l.letter,
    display: l.letter,
    src: l.src,
    kind: l.kind,
    ariaLabel: t('alphabet.signOf', { letter: l.letter }),
    dialogLabel: t('alphabet.signOf', { letter: l.letter }),
  }));

  return (
    <main id="main" className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <header className="mb-8 text-center">
        <span className="eyebrow justify-center">{t('nav.learn')}</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          {t('alphabet.title')}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-fg-muted">{t('alphabet.lead')}</p>
      </header>

      <SignBoard
        items={items}
        gridLabel={t('alphabet.gridLabel')}
        closeLabel={t('common.close')}
      />
    </main>
  );
}
