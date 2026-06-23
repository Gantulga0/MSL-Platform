import Link from 'next/link';
import type { Route } from 'next';
import type { Paginated } from '@msl/types';
import { getServerT } from '@/i18n/server';
import { apiGetSafe, TAXONOMY_READ } from '@/lib/api/server';
import type { TopicNode, WordListItem } from '@/lib/dictionary/types';
import { LiveSearch } from '@/components/LiveSearch';
import { SignFrame } from '@/components/signs/SignFrame';
import { AuthTrigger } from '@/components/auth/AuthTrigger';
import { Reveal } from '@/components/landing/Reveal';
import { ScrollProgress } from '@/components/landing/ScrollProgress';
import { BackToTop } from '@/components/landing/BackToTop';
import { StatCounter } from '@/components/landing/StatCounter';
import { LandingFooter } from '@/components/landing/LandingFooter';

/** Six feature-card icons (decorative, aria-hidden). */
const FEAT_ICONS = [
  '<path d="M5 4h11a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H7a2 2 0 0 0-2 2V4z"/><path d="M5 4a2 2 0 0 0-2 2v13a3 3 0 0 1 3-3h12"/>',
  '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  '<path d="M12 3l1.9 4.6L19 8l-3.5 3.4.8 5L12 14.5 7.7 16.4l.8-5L5 8l5.1-.4L12 3z"/>',
  '<path d="M12 12a4 4 0 1 0-4-4M6 20a6 6 0 0 1 12 0"/>',
  '<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>',
  '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
] as const;

const FEATURES = [
  { v: '', i: 0, k: 'f1' },
  { v: 'am', i: 1, k: 'f2' },
  { v: 'jd', i: 2, k: 'f3' },
  { v: '', i: 3, k: 'f4' },
  { v: 'am', i: 4, k: 'f5' },
  { v: 'jd', i: 5, k: 'f6' },
] as const;

const HOW_STEPS = ['s1', 's2', 's3'] as const;

export default async function HomePage(): Promise<React.ReactElement> {
  const t = await getServerT();
  // TODO: there is no dedicated "featured" endpoint; this shows the first N words.
  const [words, topics] = await Promise.all([
    apiGetSafe<Paginated<WordListItem>>('/words?page=1'),
    apiGetSafe<TopicNode[]>('/topics', TAXONOMY_READ),
  ]);

  const totalWords = words?.meta?.total ?? 0;
  const topicCount = topics?.length ?? 0;

  return (
    <main id="main" className="landing">
      <ScrollProgress />

      <section className="hero">
        <div className="wrap hero-grid">
          <Reveal>
            <span className="eyebrow">{t('landing.hero.eyebrow')}</span>
            <h1>
              {t('landing.hero.titleA')} <span className="mv">{t('landing.hero.titleHl')}</span>.
            </h1>
            <p className="lead">{t('landing.hero.lead')}</p>
            <div style={{ marginTop: 24 }}>
              <LiveSearch />
            </div>
            <div className="hero-cta">
              <AuthTrigger view="register" className="btn btn-amber">
                {t('landing.hero.ctaPrimary')}
              </AuthTrigger>
              <Link className="btn btn-glass" href={'/dictionary' as Route}>
                {t('landing.hero.ctaDict')}
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                {totalWords > 0 ? <StatCounter value={totalWords} /> : <b>2 480</b>}
                <span>{t('landing.hero.statWords')}</span>
              </div>
              <div className="stat">
                {topicCount > 0 ? <StatCounter value={topicCount} /> : <b>17</b>}
                <span>{t('landing.hero.statTopics')}</span>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <SignFrame />
          </Reveal>
        </div>
      </section>

      {/* FEATURES */}
      <section className="block" id="features">
        <div className="wrap">
          <Reveal className="block-head">
            <span className="eyebrow">{t('landing.features.eyebrow')}</span>
            <h2>{t('landing.features.title')}</h2>
            <p>{t('landing.features.lead')}</p>
          </Reveal>
          <Reveal className="feat">
            {FEATURES.map((f) => (
              <article key={f.k} className={`glass fcard${f.v ? ` ${f.v}` : ''}`}>
                <div
                  className="ic"
                  aria-hidden
                  dangerouslySetInnerHTML={{
                    __html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${FEAT_ICONS[f.i]}</svg>`,
                  }}
                />
                <h3>{t(`landing.features.${f.k}.title`)}</h3>
                <p>{t(`landing.features.${f.k}.body`)}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="block" id="how">
        <div className="wrap">
          <Reveal className="block-head center">
            <span className="eyebrow">{t('landing.how.eyebrow')}</span>
            <h2>{t('landing.how.title')}</h2>
          </Reveal>
          <Reveal className="steps">
            {HOW_STEPS.map((s, i) => (
              <article key={s} className="glass step">
                <div className="n">{i + 1}</div>
                <h3>{t(`landing.how.${s}.title`)}</h3>
                <p>{t(`landing.how.${s}.body`)}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      {/* LEARN */}
      <section className="block" id="learn">
        <div className="wrap">
          <Reveal className="block-head">
            <span className="eyebrow">{t('landing.learn.eyebrow')}</span>
            <h2>{t('landing.learn.title')}</h2>
          </Reveal>
          <Reveal className="learn">
            <div className="glass lcard">
              <h3>{t('landing.learn.streakTitle')}</h3>
              <div className="streak">
                <div className="ring">
                  <svg width="92" height="92" viewBox="0 0 96 96" aria-hidden>
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      fill="none"
                      stroke="var(--paper-2)"
                      strokeWidth="9"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      fill="none"
                      stroke="var(--amber)"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      strokeDashoffset="74"
                      transform="rotate(-90 48 48)"
                    />
                  </svg>
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <b>12</b>
                    <small>{t('landing.learn.streakDays')}</small>
                  </div>
                </div>
                <div>
                  <p>{t('landing.learn.streakNote')}</p>
                  <div className="days">
                    {t('landing.learn.weekdays')
                      .split(' ')
                      .map((d, i) => (
                        <i key={d} className={i < 5 ? 'on' : undefined}>
                          {d}
                        </i>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass lcard daily">
              <span className="eyebrow" style={{ color: 'var(--amber)' }}>
                {t('landing.learn.dailyEyebrow')}
              </span>
              <p>{t('landing.learn.dailyBody')}</p>
              <div className="word">{t('landing.learn.dailyWord')}</div>
              <AuthTrigger view="register" className="btn btn-amber">
                {t('landing.learn.dailyCta')}
              </AuthTrigger>
            </div>

            <div className="glass lcard">
              <h3>{t('landing.learn.badgesTitle')}</h3>
              <p>{t('landing.learn.badgesBody')}</p>
              <div className="badges">
                <div className="badge">
                  <div className="b lit">🔥</div>
                  <small>{t('landing.learn.badge1')}</small>
                </div>
                <div className="badge">
                  <div className="b lit">🖐</div>
                  <small>{t('landing.learn.badge2')}</small>
                </div>
                <div className="badge">
                  <div className="b lit">🏔</div>
                  <small>{t('landing.learn.badge3')}</small>
                </div>
                <div className="badge">
                  <div className="b">⭐</div>
                  <small>{t('landing.learn.badge4')}</small>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="block">
        <div className="wrap">
          <Reveal className="block-head center">
            <span className="eyebrow">{t('landing.testi.eyebrow')}</span>
            <h2>{t('landing.testi.title')}</h2>
          </Reveal>
          <Reveal className="quotes">
            <figure className="glass quote">
              <p>{t('landing.testi.q1')}</p>
              <div className="who">
                <div className="av">{t('landing.testi.q1.name').slice(0, 2).toUpperCase()}</div>
                <div>
                  <b>{t('landing.testi.q1.name')}</b>
                  <span>{t('landing.testi.q1.role')}</span>
                </div>
              </div>
            </figure>
            <figure className="glass quote">
              <p>{t('landing.testi.q2')}</p>
              <div className="who">
                <div
                  className="av"
                  style={{ background: 'linear-gradient(150deg,var(--amber),var(--ink))' }}
                >
                  {t('landing.testi.q2.name').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <b>{t('landing.testi.q2.name')}</b>
                  <span>{t('landing.testi.q2.role')}</span>
                </div>
              </div>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* CONTRIBUTE */}
      <section className="block" id="contribute">
        <div className="wrap">
          <Reveal className="band">
            <div>
              <span className="eyebrow" style={{ color: 'var(--amber)' }}>
                {t('landing.contribute.eyebrow')}
              </span>
              <h2>{t('landing.contribute.title')}</h2>
              <p>{t('landing.contribute.body')}</p>
              <div style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a className="btn btn-amber" href="/submit-word">
                  {t('landing.contribute.ctaSubmit')}
                </a>
                <a
                  className="btn btn-glass"
                  style={{
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,.4)',
                    background: 'rgba(255,255,255,.12)',
                  }}
                  href="/submit-word"
                >
                  {t('landing.contribute.ctaQueue')}
                </a>
              </div>
            </div>
            <div>
              {(['s1', 's2', 's3'] as const).map((s, i) => (
                <div className="bstep" key={s}>
                  <span className="n">0{i + 1}</span>
                  <div>
                    <b>{t(`landing.contribute.${s}.title`)}</b>
                    <span>{t(`landing.contribute.${s}.body`)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="block" id="cta">
        <div className="wrap">
          <Reveal className="glass cta-final">
            <span className="eyebrow center" style={{ justifyContent: 'center' }}>
              {t('landing.cta.eyebrow')}
            </span>
            <h2>{t('landing.cta.title')}</h2>
            <p>{t('landing.cta.body')}</p>
            <div className="row">
              <AuthTrigger view="register" className="btn btn-amber">
                {t('landing.cta.primary')}
              </AuthTrigger>
              <Link className="btn btn-ink" href={'/dictionary' as Route}>
                {t('landing.cta.secondary')}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <LandingFooter />
      <BackToTop />
    </main>
  );
}
