/** Thin API client. Reads the base URL from env (NFR-04: no hardcoded hosts). */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export interface ApiHealth {
  status: string;
  service: string;
  timestamp: string;
}

/** Fetches API health; returns null if the API is unreachable. */
export async function fetchApiHealth(): Promise<ApiHealth | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as ApiHealth;
  } catch {
    return null;
  }
}
