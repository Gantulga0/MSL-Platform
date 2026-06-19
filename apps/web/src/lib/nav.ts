import type { NavItem } from '@/components/AppShell';

/** "Дүрэм" dropdown — sign-language reference articles. */
export const RULES_NAV: NavItem[] = [
  { href: '/rules/standard', labelKey: 'nav.rulesStandard' },
  { href: '/rules/structure', labelKey: 'nav.rulesStructure' },
  { href: '/rules/mouthing', labelKey: 'nav.rulesMouthing' },
];

/** "Сурах" dropdown — alphabet & numbers sign references. */
export const LEARN_NAV: NavItem[] = [
  { href: '/alphabet', labelKey: 'nav.alphabet' },
  { href: '/number', labelKey: 'nav.numbers' },
];

/**
 * Public site navigation (guests + signed-in users). Sign-in / sign-up are not
 * listed here — the shell renders a single "Бүртгүүлэх" auth dropdown for guests.
 */
export const PUBLIC_NAV: NavItem[] = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/dictionary', labelKey: 'nav.dictionary' },
  { href: '/learn', labelKey: 'nav.learn', children: LEARN_NAV },
  { href: '/rules', labelKey: 'nav.rules', children: RULES_NAV },
  { href: '/submit-word', labelKey: 'nav.submitWord' },
  { href: '/games', labelKey: 'nav.games' },
];

/** Admin panel navigation. */
export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', labelKey: 'nav.adminDashboard' },
  { href: '/admin/notifications', labelKey: 'nav.notifications' },
  { href: '/admin/submissions', labelKey: 'nav.review' },
  { href: '/admin/words', labelKey: 'nav.words' },
  { href: '/admin/users', labelKey: 'nav.users' },
  { href: '/admin/topics', labelKey: 'nav.topics' },
  { href: '/admin/settings', labelKey: 'nav.systemSettings' },
];

/** Build public nav for the current session. */
export function navForSession(role: string): NavItem[] {
  // Profile now lives in the account dropdown (AppShell), not as a nav tab.
  let items = [...PUBLIC_NAV];
  if (role === 'admin') {
    items = [...items, { href: '/admin', labelKey: 'nav.adminDashboard' }];
  }
  return items;
}
