'use server';

import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/api';
import { apiSend, ApiClientError } from '@/lib/api/server';
import { getAccessToken } from '@/lib/auth/session';

export interface AdminActionResult {
  error?: string;
  ok?: boolean;
}

function fail(e: unknown): AdminActionResult {
  return { error: e instanceof ApiClientError ? e.message : 'Үйлдэл амжилтгүй.' };
}

/**
 * Upload a sign video into storage as a word-owned MediaAsset (ownerId is filled
 * in when the word is created). Mirrors the public submission upload, but with
 * ownerType='word'. Returns the new media id, or undefined on failure.
 */
async function uploadWordVideo(file: File, consentId: string): Promise<string | undefined> {
  const token = await getAccessToken();
  const type = file.type.startsWith('video') ? 'video' : 'image';
  const fd = new FormData();
  fd.set('ownerType', 'word');
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

export async function createWordAction(formData: FormData): Promise<AdminActionResult> {
  const lemma = String(formData.get('lemma') ?? '').trim();
  const exampleSentence = String(formData.get('exampleSentence') ?? '').trim();
  const topicId = String(formData.get('topicId') ?? '').trim();
  const levelId = String(formData.get('levelId') ?? '').trim();
  const ageGroupId = String(formData.get('ageGroupId') ?? '').trim();
  const handCount = String(formData.get('handCount') ?? '').trim();
  const video = formData.get('video');

  try {
    // Optional sign video: register consent (AUTH-10) then upload before creating
    // the word, so the new word can adopt the media on creation.
    const mediaIds: string[] = [];
    if (video instanceof File && video.size > 0) {
      const consent = await apiSend<{ id: string }>('POST', '/consents', { scope: 'media_publish' });
      const mediaId = await uploadWordVideo(video, consent.id);
      if (mediaId) mediaIds.push(mediaId);
    }

    await apiSend('POST', '/admin/words/create', {
      lemma,
      ...(exampleSentence ? { exampleSentence } : {}),
      topicId,
      ...(levelId ? { levelId } : {}),
      ...(ageGroupId ? { ageGroupId } : {}),
      ...(mediaIds.length ? { mediaIds } : {}),
      ...(handCount ? { handCount: Number(handCount) } : {}),
    });
    revalidatePath('/admin/words');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateWordAction(formData: FormData): Promise<AdminActionResult> {
  const id = String(formData.get('id') ?? '');
  const lemma = String(formData.get('lemma') ?? '').trim();
  const definition = String(formData.get('definition') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();

  try {
    await apiSend('PATCH', `/admin/words/${id}`, {
      ...(lemma ? { lemma } : {}),
      ...(definition ? { definition } : {}),
      ...(status ? { status } : {}),
    });
    revalidatePath('/admin/words');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteWordAction(id: string): Promise<AdminActionResult> {
  try {
    await apiSend('DELETE', `/admin/words/${id}`);
    revalidatePath('/admin/words');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
