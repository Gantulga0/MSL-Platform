import type { Metadata } from 'next';
import type { Paginated } from '@msl/types';
import { getServerT } from '@/i18n/server';
import { apiGetSafe } from '@/lib/api/server';
import { UserManager, type UserRow } from '@/components/admin/UserManager';

export const metadata: Metadata = { title: 'Хэрэглэгчид' };

export default async function AdminUsersPage(): Promise<React.ReactElement> {
  const t = await getServerT();
  const data = await apiGetSafe<Paginated<UserRow>>('/users?limit=100');
  return (
    <main id="main" className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg">{t('admin.users.title')}</h1>
      <UserManager users={data?.data ?? []} />
    </main>
  );
}
