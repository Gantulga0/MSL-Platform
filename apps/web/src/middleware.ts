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

const LEGACY_REDIRECTS: Record<string, string> = {
  '/submit': '/submit-word',
  '/my-submissions': '/profile',
  '/review': '/admin/submissions',
  '/teacher': '/admin/submissions',
};

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const legacy = LEGACY_REDIRECTS[req.nextUrl.pathname];
  if (legacy) {
    return NextResponse.redirect(new URL(legacy, req.url));
  }

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

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)'],
};
