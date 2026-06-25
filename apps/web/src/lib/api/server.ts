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

/** Cache tag for all taxonomy reads — invalidated by taxonomy mutations. */
export const TAXONOMY_TAG = 'taxonomy';

/**
 * Read options for effectively-static taxonomy (topics/levels/age-groups/
 * handedness). Served from Next's Data Cache instead of hitting the API+DB on
 * every navigation; tagged so a taxonomy edit invalidates it immediately
 * (revalidateTag), with a 5-minute backstop. Do NOT use for per-user or
 * rapidly-changing data.
 */
export const TAXONOMY_READ: ApiGetOptions = { revalidate: 300, tags: [TAXONOMY_TAG] };

/** Cache tag for the public word list + detail — invalidated by word mutations. */
export const WORDS_TAG = 'words';

/**
 * Read options for the public dictionary word list/detail. Served from Next's
 * Data Cache (60s ISR) + tagged, so navigating the dictionary/home doesn't hit
 * the API+DB on every render (the main navigation-latency win). Invalidated
 * immediately when a word is created/edited/deleted/approved (revalidateTag).
 */
export const WORDS_READ: ApiGetOptions = { revalidate: 60, tags: [WORDS_TAG] };

/** Options for read requests. */
export interface ApiGetOptions {
  /**
   * When set, the response is served from Next's Data Cache and only refetched
   * every N seconds (ISR), instead of hitting the API on every render. Omit to
   * keep `cache: 'no-store'`.
   */
  revalidate?: number;
  /** Cache tags so the entry can be purged on demand via revalidateTag(). */
  tags?: string[];
}

/** Authenticated GET against the API from a server component/action. */
export async function apiGet<T>(path: string, opts: ApiGetOptions = {}): Promise<T> {
  const cached = opts.revalidate !== undefined || opts.tags !== undefined;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: await authHeaders(),
    ...(cached
      ? {
          next: {
            ...(opts.revalidate !== undefined ? { revalidate: opts.revalidate } : {}),
            ...(opts.tags ? { tags: opts.tags } : {}),
          },
        }
      : { cache: 'no-store' }),
  });
  if (!res.ok) throw new ApiClientError(res.status, await parseError(res));
  return (await res.json()) as T;
}

/** GET that returns null instead of throwing (for optional/best-effort reads). */
export async function apiGetSafe<T>(path: string, opts: ApiGetOptions = {}): Promise<T | null> {
  try {
    return await apiGet<T>(path, opts);
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
