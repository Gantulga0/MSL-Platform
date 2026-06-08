'use server';

import { revalidatePath } from 'next/cache';
import { apiSend, ApiClientError } from '@/lib/api/server';

export interface ReviewActionResult {
  error?: string;
  ok?: boolean;
}

function fail(e: unknown): ReviewActionResult {
  return { error: e instanceof ApiClientError ? e.message : 'Үйлдэл амжилтгүй боллоо.' };
}

export async function approveAction(formData: FormData): Promise<ReviewActionResult> {
  const id = String(formData.get('id') ?? '');
  const topicId = String(formData.get('topicId') ?? '').trim();
  const comment = String(formData.get('comment') ?? '').trim();
  try {
    await apiSend('POST', `/submissions/${id}/approve`, {
      ...(topicId ? { topicId } : {}),
      ...(comment ? { comment } : {}),
    });
    revalidatePath('/review');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function rejectAction(formData: FormData): Promise<ReviewActionResult> {
  const id = String(formData.get('id') ?? '');
  const comment = String(formData.get('comment') ?? '').trim();
  try {
    await apiSend('POST', `/submissions/${id}/reject`, { comment });
    revalidatePath('/review');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function clarifyAction(formData: FormData): Promise<ReviewActionResult> {
  const id = String(formData.get('id') ?? '');
  const comment = String(formData.get('comment') ?? '').trim();
  if (!comment) return { error: 'Тайлбар шаардлагатай.' };
  try {
    await apiSend('POST', `/submissions/${id}/request-clarification`, { comment });
    revalidatePath('/review');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function batchApproveAction(ids: string[]): Promise<ReviewActionResult> {
  if (ids.length === 0) return { error: 'Сонголт алга.' };
  try {
    await apiSend('POST', '/submissions/batch-approve', { ids });
    revalidatePath('/review');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
