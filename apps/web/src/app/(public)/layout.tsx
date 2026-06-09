import { AppShell } from '@/components/AppShell';
import { navForSession } from '@/lib/nav';
import { getSession } from '@/lib/auth/session';

/** Public area — open to everyone; signed-in users get profile link. */
export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactElement> {
  const session = await getSession();
  const authed = session.role !== 'guest';

  return (
    <AppShell
      areaLabelKey="shell.public"
      navItems={navForSession(session.role)}
      user={authed ? { displayName: session.displayName ?? '' } : null}
    >
      {children}
    </AppShell>
  );
}
