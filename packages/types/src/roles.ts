/** RBAC roles, least → most privileged (SPEC §4). */
export const ROLES = ['guest', 'learner', 'contributor', 'teacher', 'admin'] as const;

export type Role = (typeof ROLES)[number];

/** Privilege rank for "at least this role" checks. Higher = more privileged. */
export const ROLE_RANK: Record<Role, number> = {
  guest: 0,
  learner: 1,
  contributor: 2,
  teacher: 3,
  admin: 4,
};

/** Mongolian (Cyrillic) display labels for roles (SPEC §4). */
export const ROLE_LABELS_MN: Record<Role, string> = {
  guest: 'Зочин',
  learner: 'Сурагч',
  contributor: 'Хувь нэмэр оруулагч',
  teacher: 'Багш / зөвлөх',
  admin: 'Админ',
};

/** True if `role` is at least as privileged as `minimum`. */
export function hasAtLeastRole(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}
