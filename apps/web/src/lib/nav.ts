import type { NavItem } from '@/components/AppShell';

/** Public site navigation (guests + signed-in users). */
export const PUBLIC_NAV: NavItem[] = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/dictionary', labelKey: 'nav.dictionary' },
  { href: '/submit-word', labelKey: 'nav.submitWord' },
  { href: '/games', labelKey: 'nav.games' },
  { href: '/login', labelKey: 'nav.login' },
  { href: '/register', labelKey: 'nav.register' },
];

/** Extra links shown when signed in (injected into public nav). */
export const AUTHED_PUBLIC_NAV: NavItem[] = [
  { href: '/profile', labelKey: 'nav.profile' },
];

/** Admin panel navigation. */
export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', labelKey: 'nav.adminDashboard' },
  { href: '/admin/submissions', labelKey: 'nav.review' },
  { href: '/admin/words', labelKey: 'nav.words' },
  { href: '/admin/users', labelKey: 'nav.users' },
  { href: '/admin/topics', labelKey: 'nav.topics' },
  { href: '/admin/settings', labelKey: 'nav.systemSettings' },
];

/** Build public nav for the current session. */
export function navForSession(role: string): NavItem[] {
  const authed = role !== 'guest';
  let items = authed
    ? PUBLIC_NAV.filter((item) => item.href !== '/login' && item.href !== '/register')
    : [...PUBLIC_NAV];
  if (authed) items = [...items, ...AUTHED_PUBLIC_NAV];
  if (role === 'admin') {
    items = [...items, { href: '/admin', labelKey: 'nav.adminDashboard' }];
  }
  return items;
}
