import { AppShell } from '@/components/AppShell';
import { Forbidden } from '@/components/Forbidden';
import { TEACHER_NAV } from '@/lib/nav';
import { getSession, roleAllows } from '@/lib/auth/session';

/** Teacher area shell — server-side RBAC guard (teacher+). */
export default async function TeacherLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactElement> {
  const session = await getSession();
  if (!roleAllows(session, 'teacher')) return <Forbidden />;

  return (
    <AppShell
      areaLabelKey="shell.teacher"
      navItems={TEACHER_NAV}
      user={{ displayName: session.displayName ?? '' }}
    >
      {children}
    </AppShell>
  );
}
