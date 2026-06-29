import { NextResponse, type NextRequest } from 'next/server';
import type { Paginated } from '@msl/types';
import { apiGetSafe } from '@/lib/api/server';
import type { WordListItem } from '@/lib/dictionary/types';

/** Lightweight hit returned to the live-search dropdown. */
export interface SearchHit {
  id: string;
  lemma: string;
  /** Synonym labels, so the dropdown can show the combined display name. */
  variants: { label: string }[];
  topic: string | null;
}

/**
 * BFF endpoint for the home live search. Proxies to the API `/words` server-side
 * (no CORS, API origin stays hidden) and returns a trimmed list of hits. The
 * dictionary itself remains the full search results page.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ items: [] as SearchHit[] });

  const data = await apiGetSafe<Paginated<WordListItem>>(
    `/words?q=${encodeURIComponent(q)}&limit=8`,
  );
  const items: SearchHit[] = (data?.data ?? []).slice(0, 8).map((w) => ({
    id: w.id,
    lemma: w.lemma,
    variants: w.variants ?? [],
    topic: w.topic?.name ?? null,
  }));

  return NextResponse.json({ items });
}
