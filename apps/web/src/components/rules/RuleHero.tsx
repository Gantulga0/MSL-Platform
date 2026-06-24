import { getServerT } from '@/i18n/server';
import { RulesNav } from '@/components/rules/RulesNav';

export interface RuleHeroProps {
  /** Decorative section icon (lucide), rendered inside the chip. `aria-hidden`. */
  icon: React.ReactNode;
  /** i18n key for the small uppercase kicker above the title. */
  eyebrowKey: string;
  /** i18n key for the page title. */
  titleKey: string;
  /** i18n key for the short lead paragraph under the title. */
  leadKey: string;
}

/**
 * Hero band for a "Дүрэм" reference page. The gradient is deliberately
 * concentrated here — the translucent `.glass` panel lets the ambient brand
 * gradient bloom through, while the reading area below stays on clean opaque
 * surfaces. Carries the page title at a confident display scale plus the
 * segmented topic nav, so the gradient and the navigation live together and the
 * prose stays distraction-free.
 */
export async function RuleHero({
  icon,
  eyebrowKey,
  titleKey,
  leadKey,
}: RuleHeroProps): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <header className="glass overflow-hidden px-6 py-9 text-center sm:px-10 sm:py-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle text-accent-ink">
          {icon}
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-ink">
          {t(eyebrowKey)}
        </span>
        <h1 className="text-balance font-display text-3xl font-extrabold leading-tight tracking-tight text-fg sm:text-4xl">
          {t(titleKey)}
        </h1>
        <p className="text-pretty text-lg leading-relaxed text-fg-muted">{t(leadKey)}</p>
      </div>
      <div className="mt-7">
        <RulesNav />
      </div>
    </header>
  );
}
