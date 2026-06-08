import type { Role } from '@msl/types';

/**
 * Auth cookie names + lifetimes. The web app is a BFF: the browser only talks to
 * Next (:3000); Next proxies to the API and stores the tokens in httpOnly cookies
 * on its own domain, so the access token never reaches client JS (AUTH-01).
 */
export const ACCESS_COOKIE = 'msl_access';
export const REFRESH_COOKIE = 'msl_refresh';
/** Cookie name the API itself sets for the refresh token. */
export const API_REFRESH_COOKIE = 'refresh_token';

export const ACCESS_MAX_AGE = 60 * 15; // 15 min (matches JWT_ACCESS_TTL)
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (matches JWT_REFRESH_TTL)

/** Landing route per role after login. */
export function homeForRole(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'teacher':
      return '/review';
    case 'learner':
      return '/profile';
    default:
      return '/dictionary';
  }
}

/** Pull a named cookie value out of a response's Set-Cookie list. */
export function extractSetCookie(setCookies: string[], name: string): string | undefined {
  for (const c of setCookies) {
    const match = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(c);
    if (match) return decodeURIComponent(match[1]);
  }
  return undefined;
}
