import { NextResponse, type NextRequest } from 'next/server';
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  API_REFRESH_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  extractSetCookie,
} from '@/lib/auth/constants';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const isProd = process.env.NODE_ENV === 'production';

/**
 * Silent refresh (AUTH-01). When the short-lived access cookie has expired but a
 * refresh cookie remains, rotate it against the API and re-issue both cookies so
 * the downstream render sees a valid session. Failure clears the stale refresh
 * cookie (forces re-login) without blocking the request.
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const hasAccess = Boolean(req.cookies.get(ACCESS_COOKIE)?.value);
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (hasAccess || !refresh) return NextResponse.next();

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `${API_REFRESH_COOKIE}=${refresh}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const cleared = NextResponse.next();
      cleared.cookies.delete(REFRESH_COOKIE);
      return cleared;
    }
    const body = (await res.json()) as { accessToken: string };
    const newRefresh = extractSetCookie(res.headers.getSetCookie(), API_REFRESH_COOKIE);
    const next = NextResponse.next();
    const common = { httpOnly: true, sameSite: 'lax' as const, secure: isProd, path: '/' };
    next.cookies.set(ACCESS_COOKIE, body.accessToken, { ...common, maxAge: ACCESS_MAX_AGE });
    if (newRefresh) {
      next.cookies.set(REFRESH_COOKIE, newRefresh, { ...common, maxAge: REFRESH_MAX_AGE });
    }
    return next;
  } catch {
    return NextResponse.next();
  }
}

// Run on pages only — skip Next internals and static assets.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)'],
};
