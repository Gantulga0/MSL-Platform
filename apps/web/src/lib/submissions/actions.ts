'use server';

import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/api';
import { apiGet, apiSend, ApiClientError } from '@/lib/api/server';
import { getAccessToken } from '@/lib/auth/session';

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

/** Live duplicate hint for the submit form (FR-03). */
export async function checkDuplicateAction(lemma: string, topic?: string): Promise<CheckResult> {
  if (!lemma.trim()) return { isDuplicate: false, candidates: [] };
  const qs = new URLSearchParams({ lemma });
  if (topic) qs.set('topic', topic);
  try {
    const res = await apiGet<CheckResult>(`/submissions/check-duplicate?${qs.toString()}`);
    return { isDuplicate: res.isDuplicate, candidates: res.candidates };
  } catch {
    return { isDuplicate: false, candidates: [] };
  }
}

export interface SubmitResult {
  error?: string;
  duplicate?: boolean;
  existingWord?: { id: string; lemma: string } | null;
}

/** Forward an optional media file (multipart) through the BFF, return its id. */
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
  const proposedLemma = String(formData.get('proposedLemma') ?? '').trim();
  const proposedDefinition = String(formData.get('proposedDefinition') ?? '').trim();
  const exampleSentence = String(formData.get('exampleSentence') ?? '').trim();
  const topicId = String(formData.get('topicId') ?? '').trim();
  const levelId = String(formData.get('levelId') ?? '').trim();
  const ageGroupId = String(formData.get('ageGroupId') ?? '').trim();
  const file = formData.get('file');
  const consent = formData.get('consent') === 'on';

  try {
    const mediaIds: string[] = [];
    if (file instanceof File && file.size > 0) {
      if (!consent) return { error: 'Медиа оруулахын тулд зөвшөөрөл шаардлагатай.' };
      // Capture consent before any media is publishable (AUTH-10).
      const consentRec = await apiSend<{ id: string }>('POST', '/consents', {
        scope: 'media_publish',
      });
      const mediaId = await uploadMedia(file, consentRec.id);
      if (mediaId) mediaIds.push(mediaId);
    }

    const res = await apiSend<{ duplicate: boolean; existingWord?: { id: string; lemma: string } | null }>(
      'POST',
      '/submissions',
      {
        proposedLemma,
        proposedDefinition,
        ...(exampleSentence ? { exampleSentence } : {}),
        ...(topicId ? { topicId } : {}),
        ...(levelId ? { levelId } : {}),
        ...(ageGroupId ? { ageGroupId } : {}),
        ...(mediaIds.length ? { mediaIds } : {}),
      },
    );
    revalidatePath('/my-submissions');
    return { duplicate: res.duplicate, existingWord: res.existingWord ?? null };
  } catch (e) {
    return { error: e instanceof ApiClientError ? e.message : 'Илгээхэд алдаа гарлаа.' };
  }
}
