import { AppShell } from '@/components/AppShell';
import { PUBLIC_NAV } from '@/lib/nav';
import { getSession } from '@/lib/auth/session';

/** Public area shell — open to guests and all authenticated roles. */
export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactElement> {
  const session = await getSession();
  const authed = session.role !== 'guest';
  // Hide login/register from the nav once signed in (logout lives in the user area).
  const navItems = authed
    ? PUBLIC_NAV.filter((item) => item.href !== '/login' && item.href !== '/register')
    : PUBLIC_NAV;

  return (
    <AppShell
      areaLabelKey="shell.public"
      navItems={navItems}
      user={authed ? { displayName: session.displayName ?? '' } : null}
    >
      {children}
    </AppShell>
  );
}
