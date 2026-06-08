import type { NavItem } from '@/components/AppShell';

/** Primary navigation per RBAC area. Hrefs settle as Phase C adds the screens. */

export const PUBLIC_NAV: NavItem[] = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/dictionary', labelKey: 'nav.dictionary' },
  { href: '/games', labelKey: 'nav.games' },
  { href: '/login', labelKey: 'nav.login' },
  { href: '/register', labelKey: 'nav.register' },
];

export const LEARNER_NAV: NavItem[] = [
  { href: '/dictionary', labelKey: 'nav.dictionary' },
  { href: '/games', labelKey: 'nav.games' },
  { href: '/daily-challenge', labelKey: 'nav.dailyChallenge' },
  { href: '/profile', labelKey: 'nav.profile' },
  { href: '/notifications', labelKey: 'nav.notifications' },
  { href: '/settings', labelKey: 'nav.settings' },
];

export const CONTRIBUTOR_NAV: NavItem[] = [
  { href: '/dictionary', labelKey: 'nav.dictionary' },
  { href: '/submit', labelKey: 'nav.submit' },
  { href: '/my-submissions', labelKey: 'nav.mySubmissions' },
  { href: '/games', labelKey: 'nav.games' },
  { href: '/notifications', labelKey: 'nav.notifications' },
];

export const TEACHER_NAV: NavItem[] = [
  { href: '/review', labelKey: 'nav.review' },
  { href: '/teacher', labelKey: 'nav.teacherDashboard' },
  { href: '/dictionary', labelKey: 'nav.dictionary' },
  { href: '/notifications', labelKey: 'nav.notifications' },
];

// Links shown in the admin nav. Pages exist for these; word/import/media/consents/
// reports/audit have APIs (admin/*) with UIs to follow.
export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', labelKey: 'nav.adminDashboard' },
  { href: '/admin/users', labelKey: 'nav.users' },
  { href: '/admin/topics', labelKey: 'nav.topics' },
  { href: '/admin/settings', labelKey: 'nav.systemSettings' },
];
