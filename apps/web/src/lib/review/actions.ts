'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { apiSend, ApiClientError, TAXONOMY_TAG } from '@/lib/api/server';

export interface ReviewActionResult {
  error?: string;
  ok?: boolean;
}

const REVIEW_PATH = '/admin/submissions';

function fail(e: unknown): ReviewActionResult {
  return { error: e instanceof ApiClientError ? e.message : 'Үйлдэл амжилтгүй боллоо.' };
}

export async function approveAction(formData: FormData): Promise<ReviewActionResult> {
  const id = String(formData.get('id') ?? '');
  const topicId = String(formData.get('topicId') ?? '').trim();
  const ageGroupId = String(formData.get('ageGroupId') ?? '').trim();
  const levelId = String(formData.get('levelId') ?? '').trim();
  const handCount = String(formData.get('handCount') ?? '').trim();
  const comment = String(formData.get('comment') ?? '').trim();
  try {
    await apiSend('POST', `/admin/submissions/${id}/approve`, {
      ...(topicId ? { topicId } : {}),
      ...(ageGroupId ? { ageGroupId } : {}),
      ...(levelId ? { levelId } : {}),
      ...(handCount ? { handCount: Number(handCount) } : {}),
      ...(comment ? { comment } : {}),
    });
    revalidatePath(REVIEW_PATH);
    revalidateTag(TAXONOMY_TAG); // a new approved word changes topic counts
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Save edits to a submission before approval (PATCH) — the "Засах" action. */
export async function editAction(formData: FormData): Promise<ReviewActionResult> {
  const id = String(formData.get('id') ?? '');
  const topicId = String(formData.get('topicId') ?? '').trim();
  const ageGroupId = String(formData.get('ageGroupId') ?? '').trim();
  const levelId = String(formData.get('levelId') ?? '').trim();
  const handCount = String(formData.get('handCount') ?? '').trim();
  try {
    await apiSend('PATCH', `/admin/submissions/${id}`, {
      ...(topicId ? { topicId } : {}),
      ...(ageGroupId ? { ageGroupId } : {}),
      ...(levelId ? { levelId } : {}),
      ...(handCount ? { handCount: Number(handCount) } : {}),
    });
    revalidatePath(`${REVIEW_PATH}/${id}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function rejectAction(formData: FormData): Promise<ReviewActionResult> {
  const id = String(formData.get('id') ?? '');
  const comment = String(formData.get('comment') ?? '').trim();
  try {
    await apiSend('POST', `/admin/submissions/${id}/reject`, { comment });
    revalidatePath(REVIEW_PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function batchApproveAction(ids: string[]): Promise<ReviewActionResult> {
  if (ids.length === 0) return { error: 'Сонголт алга.' };
  try {
    await apiSend('POST', '/admin/submissions/batch-approve', { ids });
    revalidatePath(REVIEW_PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
