import Link from 'next/link';
import type { Route } from 'next';
import { getServerT } from '@/i18n/server';

/** Shared 404 UI used by the route-segment `not-found.tsx` files. */
export async function NotFoundScreen(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main
      id="main"
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center"
    >
      <p className="text-5xl font-extrabold text-fg-subtle">404</p>
      <h1 className="mt-2 text-2xl font-bold text-fg">{t('notFound.title')}</h1>
      <p className="mt-2 text-fg-muted">{t('notFound.body')}</p>
      <Link
        href={'/' as Route}
        className="mt-6 inline-flex min-h-touch items-center rounded-full bg-primary px-5 font-semibold text-fg-on-primary transition-colors hover:bg-primary-hover"
      >
        {t('notFound.home')}
      </Link>
    </main>
  );
}
