import type { Metadata } from 'next';
import {
  Gamepad2,
  Hand,
  Hash,
  MessageSquareText,
  Camera,
  MonitorSmartphone,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { getServerT } from '@/i18n/server';
import { AlphabetGame } from '@/components/games/AlphabetGame';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('game.hub.title') };
}

/** Games not yet built — shown as clearly-labelled "coming soon" cards. */
const COMING_SOON = [
  { icon: Hash, titleKey: 'game.hub.numbersTitle', descKey: 'game.hub.numbersDesc' },
  { icon: MessageSquareText, titleKey: 'game.hub.wordsTitle', descKey: 'game.hub.wordsDesc' },
] as const;

export default async function GamesPage(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      {/* Hero header */}
      {/* <header className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle text-accent-ink">
          <Gamepad2 aria-hidden className="h-7 w-7" />
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent-ink">
          {t('game.hub.eyebrow')}
        </span>
        <h1 className="text-balance text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t('game.hub.title')}
        </h1>
        <p className="text-pretty text-lg leading-relaxed text-fg-muted">{t('game.hub.lead')}</p>
      </header> */}

      {/* Available now — the playable alphabet game */}
      <section aria-labelledby="available-title" className="mt-10">
        {/* <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 aria-hidden className="h-5 w-5 text-success" />
          <h2 id="available-title" className="text-lg font-bold tracking-tight text-fg">
            {t('game.hub.available')}
          </h2>
        </div> */}

        <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          {/* Game intro / meta strip */}
          {/* <div className="flex flex-col gap-4 border-b border-border bg-surface-muted p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-fg-on-primary">
                <Hand aria-hidden className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h3 className="text-balance text-xl font-bold tracking-tight text-fg">
                  {t('game.alphabet.title')}
                </h3>
                <p className="mt-1 text-pretty text-sm leading-relaxed text-fg-muted">
                  {t('game.alphabet.lead')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-subtle px-3 py-1 text-xs font-semibold text-success">
                <Sparkles aria-hidden className="h-4 w-4" />
                {t('game.hub.levelBeginner')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-fg-muted">
                <Camera aria-hidden className="h-4 w-4" />
                {t('game.hub.tagCamera')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-fg-muted">
                <MonitorSmartphone aria-hidden className="h-4 w-4" />
                {t('game.hub.tagOffline')}
              </span>
            </div>
          </div> */}

          {/* How to play */}
          <div className="grid gap-3 border-b border-border p-6 sm:grid-cols-3 sm:p-7">
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

          {/* The game itself */}
          <div className="p-5 sm:p-7">
            <AlphabetGame />
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section aria-labelledby="coming-title" className="mt-10">
        <div className="mb-1 flex items-center gap-2">
          <Clock aria-hidden className="h-5 w-5 text-fg-subtle" />
          <h2 id="coming-title" className="text-lg font-bold tracking-tight text-fg">
            {t('game.hub.comingSoon')}
          </h2>
        </div>
        <p className="mb-4 text-sm text-fg-muted">{t('game.hub.comingSoonLead')}</p>

        <ul className="grid gap-4 sm:grid-cols-2">
          {COMING_SOON.map(({ icon: Icon, titleKey, descKey }) => (
            <li
              key={titleKey}
              className="flex items-start gap-4 rounded-2xl border border-dashed border-border bg-surface/60 p-5"
            >
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-fg-subtle">
                <Icon aria-hidden className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-balance text-base font-bold text-fg">{t(titleKey)}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-fg-subtle">
                    <Clock aria-hidden className="h-3.5 w-3.5" />
                    {t('game.hub.locked')}
                  </span>
                </div>
                <p className="mt-1 text-pretty text-sm leading-relaxed text-fg-muted">
                  {t(descKey)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
