import { AppShell } from '@/components/AppShell';
import { PUBLIC_NAV } from '@/lib/nav';

/** Public area shell — open to guests and all authenticated roles. */
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <AppShell areaLabelKey="shell.public" navItems={PUBLIC_NAV}>
      {children}
    </AppShell>
  );
}
