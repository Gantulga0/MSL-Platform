import Link from 'next/link';
import type { Route } from 'next';
import { Card, CardBody } from '@msl/ui';
import { translate } from '@/i18n';
import { fetchApiHealth } from '@/lib/api';

export default async function HomePage(): Promise<React.ReactElement> {
  const health = await fetchApiHealth();
  const apiOnline = health?.status === 'ok';

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-fg">{translate('app.title')}</h1>
        <p className="mt-2 text-lg text-fg-muted">{translate('app.tagline')}</p>
      </header>

      <section aria-labelledby="search-heading" className="mb-10">
        <h2 id="search-heading" className="sr-only">
          {translate('home.searchPlaceholder')}
        </h2>
        <label htmlFor="word-search" className="block text-sm font-medium text-fg">
          {translate('nav.dictionary')}
        </label>
        <input
          id="word-search"
          type="search"
          placeholder={translate('home.searchPlaceholder')}
          className="mt-1 h-control-sm w-full rounded-md border border-border-strong px-3 text-base"
        />
      </section>

      <Card>
        <CardBody>
          <p aria-live="polite" className="text-sm">
            <span className="font-medium text-fg">API:</span>{' '}
            {apiOnline ? (
              <span className="text-success">● {translate('status.healthy')}</span>
            ) : (
              <span className="text-fg-subtle">○ offline (dev)</span>
            )}
          </p>
          <p className="mt-3 text-sm text-fg-muted">
            <Link href={'/design-system' as Route} className="font-medium text-primary underline">
              {translate('ds.title')}
            </Link>
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
