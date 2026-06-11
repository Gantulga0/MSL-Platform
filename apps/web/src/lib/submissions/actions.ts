'use server';

import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/api';
import { apiSend, ApiClientError } from '@/lib/api/server';
import { getAccessToken, getSession } from '@/lib/auth/session';

export interface DuplicateCandidate {
  wordId: string;
  lemma: string;
  method: string;
  score: number;
}
export interface CheckResult {
  isDuplicate: boolean;
  candidates: DuplicateCandidate[];
}

/** Live duplicate hint — public endpoint, no auth required. */
export async function checkDuplicateAction(lemma: string, topic?: string): Promise<CheckResult> {
  if (!lemma.trim()) return { isDuplicate: false, candidates: [] };
  const qs = new URLSearchParams({ lemma });
  if (topic) qs.set('topic', topic);
  try {
    const res = await fetch(`${API_BASE_URL}/submissions/check-duplicate?${qs.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return { isDuplicate: false, candidates: [] };
    const data = (await res.json()) as CheckResult;
    return { isDuplicate: data.isDuplicate, candidates: data.candidates };
  } catch {
    return { isDuplicate: false, candidates: [] };
  }
}

export interface SubmitResult {
  error?: string;
  loginRequired?: boolean;
  duplicate?: boolean;
  existingWord?: { id: string; lemma: string } | null;
}

async function uploadMedia(file: File, consentId: string): Promise<string | undefined> {
  const token = await getAccessToken();
  const type = file.type.startsWith('video') ? 'video' : 'image';
  const fd = new FormData();
  fd.set('ownerType', 'submission');
  fd.set('type', type);
  fd.set('consentId', consentId);
  fd.set('file', file);
  const res = await fetch(`${API_BASE_URL}/media`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
    cache: 'no-store',
  });
  if (!res.ok) return undefined;
  const media = (await res.json()) as { id: string };
  return media.id;
}

export async function createSubmissionAction(formData: FormData): Promise<SubmitResult> {
  const session = await getSession();
  if (session.role === 'guest') return { loginRequired: true };

  // Simplified public submission (FR-02): name + video only.
  const proposedLemma = String(formData.get('proposedLemma') ?? '').trim();
  const file = formData.get('file');
  const consent = formData.get('consent') === 'on';

  if (!proposedLemma) return { error: 'Үгийн нэр шаардлагатай.' };
  if (!(file instanceof File) || file.size === 0) return { error: 'Видео заавал шаардлагатай.' };
  if (!consent) return { error: 'Медиа оруулахын тулд зөвшөөрөл шаардлагатай.' };

  try {
    const consentRec = await apiSend<{ id: string }>('POST', '/consents', {
      scope: 'media_publish',
    });
    const mediaId = await uploadMedia(file, consentRec.id);
    const mediaIds = mediaId ? [mediaId] : [];

    const res = await apiSend<{ duplicate: boolean; existingWord?: { id: string; lemma: string } | null }>(
      'POST',
      '/submissions',
      {
        proposedLemma,
        ...(mediaIds.length ? { mediaIds } : {}),
      },
    );
    revalidatePath('/profile');
    return { duplicate: res.duplicate, existingWord: res.existingWord ?? null };
  } catch (e) {
    if (e instanceof ApiClientError && e.status === 401) return { loginRequired: true };
    return { error: e instanceof ApiClientError ? e.message : 'Илгээхэд алдаа гарлаа.' };
  }
}
