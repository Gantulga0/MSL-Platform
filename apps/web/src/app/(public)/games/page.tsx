import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { Hand, Flag, ArrowRight, Hash, MessageSquareText, Clock } from 'lucide-react';
import { getServerT } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('game.hub.title') };
}

/**
 * Playable games. Each card's media area layers an optional cover image
 * (drop a PNG at the `cover` path) over a brand gradient fallback — so the card
 * looks finished now and upgrades automatically once the artwork is added.
 */
const GAMES = [
  {
    href: '/games/fruit-ninja',
    cover: '/games/covers/fruit-ninja.png',
    gradient: 'linear-gradient(135deg, var(--jade), var(--amber))',
    icon: Hand,
    titleKey: 'game.hub.fruitTitle',
    descKey: 'game.hub.fruitDesc',
  },
  {
    href: '/games/racer',
    cover: '/games/covers/racer.png',
    gradient: 'linear-gradient(135deg, var(--sky), var(--amber))',
    icon: Flag,
    titleKey: 'game.hub.racerTitle',
    descKey: 'game.hub.racerDesc',
  },
] as const;

const COMING_SOON = [
  { icon: Hash, titleKey: 'game.hub.numbersTitle', descKey: 'game.hub.numbersDesc' },
  { icon: MessageSquareText, titleKey: 'game.hub.wordsTitle', descKey: 'game.hub.wordsDesc' },
] as const;

export default async function GamesPage(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <header className="mb-8 text-center">
        <span className="eyebrow justify-center">{t('game.hub.eyebrow')}</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          {t('game.hub.title')}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-fg-muted">{t('game.hub.chooseGame')}</p>
      </header>

      <ul className="grid gap-5 sm:grid-cols-2">
        {GAMES.map(({ href, cover, gradient, icon: Icon, titleKey, descKey }) => (
          <li key={href}>
            <Link
              href={href as Route}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-xl focus-visible:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none"
            >
              <div
                className="relative aspect-[16/10] w-full bg-cover bg-center"
                style={{ backgroundImage: cover ? `url('${cover}'), ${gradient}` : gradient }}
              >
                <span className="absolute bottom-3 left-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-slate-950/40 text-white backdrop-blur">
                  <Icon aria-hidden className="h-6 w-6" />
                </span>
              </div>
              {/* <div className="flex flex-1 flex-col p-5">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold text-fg">
                  {t(titleKey)}
                  <ArrowRight
                    aria-hidden
                    className="h-5 w-5 text-fg-subtle transition-transform group-hover:translate-x-0.5"
                  />
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t(descKey)}</p>
              </div> */}
            </Link>
          </li>
        ))}
      </ul>

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
