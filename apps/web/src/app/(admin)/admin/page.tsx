import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { Card, CardBody } from '@msl/ui';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';

export const metadata: Metadata = { title: 'Удирдлагын самбар' };

type Dash = Record<string, number>;

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const [dash, reports] = await Promise.all([
    apiGetSafe<Dash>('/admin/dashboard'),
    apiGetSafe<Dash>('/admin/reports/summary'),
  ]);
  const d = dash ?? {};
  const r = reports ?? {};

  const kpis: { label: string; value: number; tone: string }[] = [
    { label: translate('admin.dash.totalWords'), value: d.totalWords ?? 0, tone: 'text-fg' },
    { label: translate('admin.dash.approvedWords'), value: d.approvedWords ?? 0, tone: 'text-success' },
    { label: translate('admin.dash.pending'), value: d.pending ?? 0, tone: 'text-warning' },
    { label: translate('admin.dash.duplicates'), value: d.duplicates ?? 0, tone: 'text-info' },
    { label: translate('admin.dash.rejected'), value: d.rejected ?? 0, tone: 'text-danger' },
    { label: translate('admin.dash.activeUsers'), value: d.activeUsers ?? 0, tone: 'text-fg' },
    { label: translate('admin.dash.gameSessions'), value: d.gameSessions ?? 0, tone: 'text-fg' },
    { label: translate('admin.dash.approvedPercent'), value: r.approvedPercent ?? 0, tone: 'text-primary' },
    { label: translate('admin.dash.totalViews'), value: r.totalWordViews ?? 0, tone: 'text-fg' },
  ];

  const links: { href: Route; label: string }[] = [
    { href: '/admin/submissions' as Route, label: translate('nav.review') },
    { href: '/admin/words' as Route, label: translate('nav.words') },
    { href: '/admin/users' as Route, label: translate('nav.users') },
    { href: '/admin/topics' as Route, label: translate('nav.topics') },
    { href: '/admin/settings' as Route, label: translate('nav.systemSettings') },
  ];

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg">{translate('admin.dash.title')}</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardBody>
              <p className={`text-3xl font-bold ${k.tone}`}>{k.value}</p>
              <p className="mt-1 text-sm text-fg-muted">{k.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <nav aria-label={translate('admin.dash.manage')} className="mt-8 flex flex-wrap gap-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex min-h-touch items-center rounded-md border border-border-strong bg-surface px-4 font-medium text-fg hover:bg-surface-muted"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
