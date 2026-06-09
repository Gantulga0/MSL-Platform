/** RBAC roles — guest (unauthenticated) + authenticated user/admin. */
export const ROLES = ['guest', 'user', 'admin'] as const;

export type Role = (typeof ROLES)[number];

/** Privilege rank for "at least this role" checks. Higher = more privileged. */
export const ROLE_RANK: Record<Role, number> = {
  guest: 0,
  user: 1,
  admin: 2,
};

/** Mongolian (Cyrillic) display labels for roles. */
export const ROLE_LABELS_MN: Record<Role, string> = {
  guest: 'Зочин',
  user: 'Хэрэглэгч',
  admin: 'Админ',
};

/** True if `role` is at least as privileged as `minimum`. */
export function hasAtLeastRole(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}
