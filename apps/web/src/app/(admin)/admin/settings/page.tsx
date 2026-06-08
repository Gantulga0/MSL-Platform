import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';
import { SettingsManager, type SettingRow } from '@/components/admin/SettingsManager';

export const metadata: Metadata = { title: 'Системийн тохиргоо' };

export default async function AdminSettingsPage(): Promise<React.ReactElement> {
  const settings = await apiGetSafe<SettingRow[]>('/admin/settings');
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg">{translate('admin.settings.title')}</h1>
      <SettingsManager settings={settings ?? []} />
    </main>
  );
}
