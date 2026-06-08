'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import type { Role } from '@msl/types';
import { API_BASE_URL } from '@/lib/api';
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  API_REFRESH_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  extractSetCookie,
  homeForRole,
} from './constants';

/** Result of an auth action. `error` is a localized-key-free message from the API. */
export interface ActionState {
  error?: string;
  message?: string;
}

const isProd = process.env.NODE_ENV === 'production';

async function readApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    return body.error?.message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

/** Persist the access token + the API's refresh token as httpOnly web cookies. */
async function persistSession(apiRes: Response, accessToken: string): Promise<void> {
  const store = await cookies();
  const common = { httpOnly: true, sameSite: 'lax' as const, secure: isProd, path: '/' };
  store.set(ACCESS_COOKIE, accessToken, { ...common, maxAge: ACCESS_MAX_AGE });
  const refresh = extractSetCookie(apiRes.headers.getSetCookie(), API_REFRESH_COOKIE);
  if (refresh) store.set(REFRESH_COOKIE, refresh, { ...common, maxAge: REFRESH_MAX_AGE });
}

async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

interface LoginResult {
  accessToken: string;
  user: { role: Role };
}

// ── Login (email/username + password) ────────────────────────────────────────

export async function loginAction(formData: FormData): Promise<ActionState> {
  const identifier = String(formData.get('identifier') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!identifier || !password) return { error: 'Please enter your credentials.' };

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
    cache: 'no-store',
  });
  if (!res.ok) return { error: await readApiError(res) };

  const body = (await res.json()) as LoginResult;
  await persistSession(res, body.accessToken);
  redirect(homeForRole(body.user.role) as Route);
}

// ── Learner login (username + class code/PIN) ─────────────────────────────────

export async function classCodeLoginAction(formData: FormData): Promise<ActionState> {
  const username = String(formData.get('username') ?? '').trim();
  const classCode = String(formData.get('classCode') ?? '').trim();
  const pin = String(formData.get('pin') ?? '').trim();
  if (!username || !classCode) return { error: 'Please enter your username and class code.' };

  const res = await fetch(`${API_BASE_URL}/auth/login/class-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, classCode, ...(pin ? { pin } : {}) }),
    cache: 'no-store',
  });
  if (!res.ok) return { error: await readApiError(res) };

  const body = (await res.json()) as LoginResult;
  await persistSession(res, body.accessToken);
  redirect(homeForRole(body.user.role) as Route);
}

// ── Register (email account) ──────────────────────────────────────────────────

export async function registerAction(formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('displayName') ?? '').trim();
  const consent = formData.get('consent') === 'on';
  if (!consent) return { error: 'You must accept the consent terms to register.' };

  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
    cache: 'no-store',
  });
  if (!res.ok) return { error: await readApiError(res) };
  const body = (await res.json()) as { message: string };
  return { message: body.message };
}

// ── Password reset (request + complete) ───────────────────────────────────────

export async function forgotPasswordAction(formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    cache: 'no-store',
  });
  if (!res.ok) return { error: await readApiError(res) };
  const body = (await res.json()) as { message: string };
  return { message: body.message };
}

export async function resetPasswordAction(formData: FormData): Promise<ActionState> {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
    cache: 'no-store',
  });
  if (!res.ok) return { error: await readApiError(res) };
  const body = (await res.json()) as { message: string };
  return { message: body.message };
}

// ── Email verification ────────────────────────────────────────────────────────

export async function verifyEmailAction(formData: FormData): Promise<ActionState> {
  const token = String(formData.get('token') ?? '');
  if (!token) return { error: 'Missing verification token.' };
  const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    cache: 'no-store',
  });
  if (!res.ok) return { error: await readApiError(res) };
  const body = (await res.json()) as { message: string };
  return { message: body.message };
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  const refresh = store.get(REFRESH_COOKIE)?.value;
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: refresh ? { Cookie: `${API_REFRESH_COOKIE}=${refresh}` } : {},
      cache: 'no-store',
    });
  } catch {
    // Best-effort server-side revocation; always clear local cookies regardless.
  }
  await clearSession();
  redirect('/');
}
