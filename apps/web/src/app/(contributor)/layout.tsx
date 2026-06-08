import { AppShell } from '@/components/AppShell';
import { Forbidden } from '@/components/Forbidden';
import { CONTRIBUTOR_NAV } from '@/lib/nav';
import { getSession, roleAllows } from '@/lib/auth/session';

/** Contributor area shell — server-side RBAC guard (contributor+). */
export default async function ContributorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactElement> {
  const session = await getSession();
  if (!roleAllows(session, 'contributor')) return <Forbidden />;

  return (
    <AppShell
      areaLabelKey="shell.public"
      navItems={CONTRIBUTOR_NAV}
      user={{ displayName: session.displayName ?? '' }}
    >
      {children}
    </AppShell>
  );
}
