import { AppShell } from '@/components/AppShell';
import { Forbidden } from '@/components/Forbidden';
import { ADMIN_NAV } from '@/lib/nav';
import { getSession, roleAllows } from '@/lib/auth/session';

/** Admin area shell — server-side RBAC guard (admin only). */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactElement> {
  const session = await getSession();
  if (!roleAllows(session, 'admin')) return <Forbidden />;

  return (
    <AppShell areaLabelKey="shell.admin" navItems={ADMIN_NAV}>
      {children}
    </AppShell>
  );
}
