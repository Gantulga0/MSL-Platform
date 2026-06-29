import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { TAXONOMY_TAG, WORDS_TAG } from '@/lib/api/server';

/**
 * Purges the Next Data Cache for the public word list/detail + taxonomy. Needed
 * after out-of-band DB changes (e.g. the bulk `scripts/import-words.mjs`, which
 * writes straight to Postgres and so never triggers the API's revalidateTag).
 *
 * Guarded by REVALIDATE_SECRET when set (pass `?secret=` or `x-revalidate-secret`);
 * open in local dev when the env var is unset.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.REVALIDATE_SECRET;
  if (expected) {
    const provided =
      req.nextUrl.searchParams.get('secret') ?? req.headers.get('x-revalidate-secret');
    if (provided !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  revalidateTag(WORDS_TAG);
  revalidateTag(TAXONOMY_TAG);
  return NextResponse.json({ revalidated: [WORDS_TAG, TAXONOMY_TAG] });
}
