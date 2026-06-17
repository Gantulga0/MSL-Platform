import { translate } from '@/i18n';
import { LiveSearch } from '@/components/LiveSearch';
import { SignFrame } from '@/components/signs/SignFrame';

export default function HomePage(): React.ReactElement {
  return (
    <main id="main" className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      {/* Hero: search on the LEFT, the sign-motion visual on the RIGHT. */}
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <span className="eyebrow">{translate('app.shortTitle')}</span>
          <h1
            className="mt-4 text-4xl text-fg sm:text-5xl"
            style={{ fontFamily: 'var(--font-pacifico), var(--font-display), cursive', lineHeight: 1.2 }}
          >
            {translate('app.title')}
          </h1>
          <p className="mt-4 max-w-prose text-lg text-fg-muted">{translate('app.tagline')}</p>

          <section aria-labelledby="search-heading" className="mt-8">
            <h2 id="search-heading" className="sr-only">
              {translate('home.searchPlaceholder')}
            </h2>
            {/* Live results as you type; Enter → /dictionary?q=… full results. */}
            <LiveSearch />
          </section>
        </div>

        {/* Decorative gesture-trail visual (presentational). */}
        <div className="mx-auto w-full max-w-sm lg:max-w-none">
          <SignFrame />
        </div>
      </div>
    </main>
  );
}
