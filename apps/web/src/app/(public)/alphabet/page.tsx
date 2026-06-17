import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { ALPHABET } from '@/lib/signs/alphabet';
import { SignBoard } from '@/components/signs/SignBoard';
import type { SignItem } from '@/components/signs/types';

export const metadata: Metadata = { title: translate('alphabet.title') };

export default function AlphabetPage(): React.ReactElement {
  const items: SignItem[] = ALPHABET.map((l) => ({
    key: l.letter,
    display: l.letter,
    src: l.src,
    ariaLabel: translate('alphabet.signOf', undefined, { letter: l.letter }),
    dialogLabel: translate('alphabet.signOf', undefined, { letter: l.letter }),
  }));

  return (
    <main id="main" className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {translate('alphabet.title')}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-base text-fg-muted">
          {translate('alphabet.lead')}
        </p>
      </header>

      <SignBoard
        items={items}
        gridLabel={translate('alphabet.gridLabel')}
        closeLabel={translate('common.close')}
      />
    </main>
  );
}
