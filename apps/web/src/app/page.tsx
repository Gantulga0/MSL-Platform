import { translate } from '@/i18n';
import { fetchApiHealth } from '@/lib/api';

export default async function HomePage(): Promise<React.ReactElement> {
  const health = await fetchApiHealth();
  const apiOnline = health?.status === 'ok';

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">{translate('app.title')}</h1>
        <p className="mt-2 text-lg text-gray-700">{translate('app.tagline')}</p>
      </header>

      <section aria-labelledby="search-heading" className="mb-10">
        <h2 id="search-heading" className="sr-only">
          {translate('home.searchPlaceholder')}
        </h2>
        <label htmlFor="word-search" className="block text-sm font-medium">
          {translate('nav.dictionary')}
        </label>
        <input
          id="word-search"
          type="search"
          placeholder={translate('home.searchPlaceholder')}
          className="mt-1 min-h-touch w-full rounded-md border border-gray-400 px-3 py-2"
        />
      </section>

      <section aria-live="polite" className="rounded-md border border-gray-300 p-4">
        <p className="text-sm">
          <span className="font-medium">API:</span>{' '}
          {apiOnline ? (
            <span className="text-green-700">● {translate('status.healthy')}</span>
          ) : (
            <span className="text-gray-500">○ offline (dev)</span>
          )}
        </p>
      </section>
    </main>
  );
}
