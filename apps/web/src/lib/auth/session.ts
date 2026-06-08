import { cookies } from 'next/headers';
import { ROLE_RANK, type Role } from '@msl/types';
import { API_BASE_URL } from '@/lib/api';
import { ACCESS_COOKIE } from './constants';

/**
 * Server-side session. Reads the httpOnly access-token cookie set by the auth
 * actions and validates it against the API `/auth/me` (the API is the single
 * source of truth for identity + role). Returns a guest session when there is no
 * valid token. Silent refresh of an expired access token is handled by the Next
 * middleware before this runs. RBAC here gates UI only — the API enforces it on
 * every endpoint (AUTH-06).
 */
export interface Session {
  role: Role;
  id?: string;
  displayName?: string;
  username?: string | null;
  email?: string | null;
  isMinor: boolean;
}

const GUEST: Session = { role: 'guest', isMinor: false };

export async function getSession(): Promise<Session> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return GUEST;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return GUEST;
    const user = (await res.json()) as {
      id: string;
      role: Role;
      displayName: string;
      username: string | null;
      email: string | null;
      isMinor: boolean;
    };
    return {
      role: user.role,
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      isMinor: user.isMinor,
    };
  } catch {
    // API unreachable → treat as guest rather than crash the render.
    return GUEST;
  }
}

/** Raw access token for server components that call the API directly. */
export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

/** True if the session role is at least `minimum`. */
export function roleAllows(session: Session, minimum: Role): boolean {
  return ROLE_RANK[session.role] >= ROLE_RANK[minimum];
}
