'use server';

import { revalidatePath } from 'next/cache';
import { apiSend, ApiClientError } from '@/lib/api/server';

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
  const comment = String(formData.get('comment') ?? '').trim();
  try {
    await apiSend('POST', `/admin/submissions/${id}/approve`, {
      ...(topicId ? { topicId } : {}),
      ...(comment ? { comment } : {}),
    });
    revalidatePath(REVIEW_PATH);
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
