import { cookies } from 'next/headers';
import { ROLE_RANK, type Role } from '@msl/types';

/**
 * Session abstraction. Phase A ships a STUB that reads a demo role from a cookie
 * so the RBAC route-group shells and guards are real and reviewable. Phase C
 * (Auth & onboarding) replaces `getSession()` with JWT/refresh-cookie validation
 * against the API — call sites (layouts/guards) stay unchanged.
 */
export interface Session {
  role: Role;
  displayName?: string;
  isMinor?: boolean;
}

const DEMO_ROLE_COOKIE = 'msl_demo_role';
const VALID_ROLES: Role[] = ['guest', 'learner', 'contributor', 'teacher', 'admin'];

export async function getSession(): Promise<Session> {
  const store = await cookies();
  const raw = store.get(DEMO_ROLE_COOKIE)?.value as Role | undefined;
  const role: Role = raw && VALID_ROLES.includes(raw) ? raw : 'guest';
  return { role, displayName: undefined, isMinor: role === 'learner' };
}

/** True if the session role is at least `minimum`. */
export function roleAllows(session: Session, minimum: Role): boolean {
  return ROLE_RANK[session.role] >= ROLE_RANK[minimum];
}
