import { translate as t } from '@/i18n';
import { GestureScene } from './GestureScene';

/**
 * Hero visual — a dark "sign stage" with the gesture-trail motif and a live tag.
 * Purely decorative/presentational (no data, no audio cue): it illustrates the
 * design thesis that a sign is motion. The caption is the brand tagline, not
 * word-specific content. Lives on the right of the hero's two-column split.
 */
export function SignFrame(): React.ReactElement {
  return (
    <div
      className="sign-stage is-anim relative aspect-[4/5] overflow-hidden rounded-[28px] border border-[var(--line)] shadow-[var(--shadow)]"
      role="img"
      aria-label={t('home.heroVisualLabel')}
    >
      {/* Live indicator. */}
      <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-[var(--rose)] shadow-[0_0_0_4px_rgba(255,93,115,.3)]" />
        {t('home.heroLiveTag')}
      </span>

      <GestureScene className="absolute inset-0 h-full w-full" />

      {/* Caption — the brand tagline. */}
      <div className="absolute inset-x-4 bottom-4 z-10 rounded-2xl border border-white/15 bg-[rgba(10,11,40,.4)] px-4 py-3 text-white backdrop-blur">
        <b className="block font-display text-xl font-bold">{t('home.heroVisualCaption')}</b>
        <span className="text-sm text-[#c9caf2]">{t('app.tagline')}</span>
      </div>
    </div>
  );
}
