import type { Role } from '@msl/types';

/** JWT access-token payload. */
export interface JwtPayload {
  sub: string;
  role: Role;
  isMinor: boolean;
}

/** The authenticated principal attached to the request by JwtAuthGuard. */
export interface AuthenticatedUser {
  id: string;
  role: Role;
  isMinor: boolean;
}

/** Express request augmented with the authenticated user. */
export interface RequestWithUser {
  user?: AuthenticatedUser;
  cookies?: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  method: string;
  originalUrl?: string;
  url: string;
}
