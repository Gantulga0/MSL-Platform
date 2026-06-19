// Alphabet/number hand-sign videos are public, fixed reference assets (not
// user-submitted dictionary media, which uses the signed-URL R2 pipeline).
// Serve them from a CDN when NEXT_PUBLIC_SIGNS_BASE_URL is set — e.g. a
// Cloudflare R2 public bucket / custom domain — otherwise fall back to the
// files bundled under apps/web/public/signs for local dev.
const BASE = (process.env.NEXT_PUBLIC_SIGNS_BASE_URL ?? '').replace(/\/$/, '');

/** Resolve a `/signs/...` path to its CDN URL, or leave it local when unset. */
export function signAsset(path: string): string {
  return BASE ? `${BASE}${path}` : path;
}
