import type { Role } from '@msl/types';

export interface JwtPayload {
  sub: string;
  role: Role;
  isMinor: boolean;
}

export interface AuthenticatedUser {
  id: string;
  role: Role;
  isMinor: boolean;
}

export interface RequestWithUser {
  user?: AuthenticatedUser;
  cookies?: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  method: string;
  originalUrl?: string;
  url: string;
}
