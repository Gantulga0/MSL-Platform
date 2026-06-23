import type { Metadata } from 'next';
import { getServerT } from '@/i18n/server';
import { apiGetSafe } from '@/lib/api/server';
import { OptionUploader } from '@/components/admin/OptionUploader';
import type { TaxoRef } from '@/lib/dictionary/types';

export const metadata: Metadata = { title: 'Сонголтын зураг' };

const GROUPS = [{ path: '/handedness', titleKey: 'dict.hands' }] as const;

export default async function AdminOptionsPage(): Promise<React.ReactElement> {
  const t = await getServerT();
  const lists = await Promise.all(GROUPS.map((g) => apiGetSafe<TaxoRef[]>(g.path)));

  return (
    <main id="main" className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg">
        {t('admin.options.title')}
      </h1>

      <OptionUploader />

      <section className="mt-8 space-y-6">
        <h2 className="text-lg font-semibold text-fg">{t('admin.options.existing')}</h2>
        {GROUPS.map((g, i) => (
          <div key={g.path}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
              {t(g.titleKey)}
            </h3>
            {(lists[i] ?? []).length === 0 ? (
              <p className="text-sm text-fg-muted">{t('admin.options.empty')}</p>
            ) : (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {(lists[i] ?? []).map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface p-2"
                  >
                    <span className="flex h-16 w-full items-center justify-center overflow-hidden rounded-md bg-surface-muted">
                      {o.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.imageUrl} alt={o.label ?? ''} className="h-full w-full object-contain" />
                      ) : null}
                    </span>
                    <span className="text-xs text-fg-muted">{o.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
