import { AppShell } from '@/components/AppShell';
import { Forbidden } from '@/components/Forbidden';
import { LEARNER_NAV } from '@/lib/nav';
import { getSession, roleAllows } from '@/lib/auth/session';

/** Learner area shell — server-side RBAC guard (learner+). */
export default async function LearnerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactElement> {
  const session = await getSession();
  if (!roleAllows(session, 'learner')) return <Forbidden />;

  return (
    <AppShell areaLabelKey="shell.learner" navItems={LEARNER_NAV}>
      {children}
    </AppShell>
  );
}
