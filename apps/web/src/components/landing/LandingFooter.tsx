import Link from 'next/link';
import type { Route } from 'next';
import { translate as t } from '@/i18n';

/**
 * Landing footer. Internal columns link to REAL routes (dictionary, games,
 * submit-word, rules) or in-page anchors (#features, #how). A few marketing links
 * (about / partners / privacy / contact / help) have no page yet — they are
 * rendered as inert `#` placeholders and marked TODO until those pages exist.
 */
export function LandingFooter(): React.ReactElement {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="brand">
              <svg className="mark" viewBox="0 0 40 40" fill="none" aria-hidden>
                <rect width="40" height="40" rx="12" fill="var(--ink)" />
                <path
                  d="M9 27 C 15 14, 25 14, 31 25"
                  stroke="var(--amber)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="2 6"
                />
                <circle cx="31" cy="25" r="4.5" fill="var(--sky)" />
                <circle cx="9" cy="27" r="3" fill="var(--amber)" />
              </svg>
              <span>
                MSL<small>{t('app.shortTitle')}</small>
              </span>
            </div>
            <p className="tagline">{t('landing.foot.tagline')}</p>
          </div>

          <div>
            <h4>{t('landing.foot.product')}</h4>
            <Link href={'/dictionary' as Route}>{t('nav.dictionary')}</Link>
            <a href="#features">{t('landing.features.eyebrow')}</a>
            <Link href={'/games' as Route}>{t('nav.games')}</Link>
            <Link href={'/submit-word' as Route}>{t('nav.submitWord')}</Link>
          </div>

          <div>
            <h4>{t('landing.foot.resources')}</h4>
            <a href="#how">{t('landing.how.eyebrow')}</a>
            <Link href={'/rules/standard' as Route}>{t('nav.rules')}</Link>
            {/* TODO: dedicated accessibility / help pages do not exist yet. */}
            <a href="#features">{t('landing.foot.accessibility')}</a>
            <a href="#contribute">{t('nav.help')}</a>
          </div>

          <div>
            <h4>{t('landing.foot.org')}</h4>
            {/* TODO: about / partners / privacy / contact pages do not exist yet. */}
            <a href="#">{t('landing.foot.about')}</a>
            <a href="#">{t('landing.foot.partners')}</a>
            <a href="#">{t('landing.foot.privacy')}</a>
            <a href="#">{t('landing.foot.contact')}</a>
          </div>
        </div>

        <div className="foot-bottom">
          <span>{t('landing.foot.rights')}</span>
          <span>{t('landing.foot.lang')}</span>
        </div>
      </div>
    </footer>
  );
}
