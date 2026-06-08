import { API_BASE_URL } from '@/lib/api';
import { getAccessToken } from '@/lib/auth/session';

/** Error carrying the API's status + envelope message for server-side calls. */
export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    return body.error?.message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Authenticated GET against the API from a server component/action. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiClientError(res.status, await parseError(res));
  return (await res.json()) as T;
}

/** GET that returns null instead of throwing (for optional/best-effort reads). */
export async function apiGetSafe<T>(path: string): Promise<T | null> {
  try {
    return await apiGet<T>(path);
  } catch {
    return null;
  }
}

type Method = 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/** Authenticated mutating request (POST/PATCH/PUT/DELETE). */
export async function apiSend<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(await authHeaders()),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiClientError(res.status, await parseError(res));
  // 204 / empty bodies are valid.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
