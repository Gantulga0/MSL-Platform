'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { API_BASE_URL } from '@/lib/api';
import { apiSend, ApiClientError, TAXONOMY_TAG } from '@/lib/api/server';
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
    revalidateTag(TAXONOMY_TAG); // word counts feed the cached taxonomy
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export interface BulkImportResult {
  error?: string;
  total?: number;
  success?: number;
  errors?: { row: number; reason: string }[];
}

/**
 * Forward a multipart bulk import (videos + a JSON manifest) to the API, which
 * uploads each video to object storage (R2) and creates the words. The browser
 * builds the FormData; this server action just attaches the auth token (httpOnly
 * cookie, not reachable client-side) and relays it.
 */
export async function bulkImportWordsAction(formData: FormData): Promise<BulkImportResult> {
  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: 'Эхлээд видео файл сонгоно уу.' };

  const fd = new FormData();
  for (const f of files) fd.append('files', f);
  fd.set('manifest', String(formData.get('manifest') ?? '[]'));
  fd.set('status', String(formData.get('status') ?? 'pending'));

  try {
    const token = await getAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin/imports/files`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      return { error: body?.error?.message ?? `Импорт амжилтгүй (${res.status}).` };
    }
    const data = (await res.json()) as Omit<BulkImportResult, 'error'>;
    revalidatePath('/admin/words');
    revalidateTag(TAXONOMY_TAG); // word counts feed the cached taxonomy
    return data;
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
    revalidateTag(TAXONOMY_TAG); // word counts feed the cached taxonomy
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteWordAction(id: string): Promise<AdminActionResult> {
  try {
    await apiSend('DELETE', `/admin/words/${id}`);
    revalidatePath('/admin/words');
    revalidateTag(TAXONOMY_TAG); // word counts feed the cached taxonomy
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
