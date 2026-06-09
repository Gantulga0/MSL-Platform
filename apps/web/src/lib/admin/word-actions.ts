'use server';

import { revalidatePath } from 'next/cache';
import { apiSend, ApiClientError } from '@/lib/api/server';

export interface AdminActionResult {
  error?: string;
  ok?: boolean;
}

function fail(e: unknown): AdminActionResult {
  return { error: e instanceof ApiClientError ? e.message : 'Үйлдэл амжилтгүй.' };
}

export async function createWordAction(formData: FormData): Promise<AdminActionResult> {
  const lemma = String(formData.get('lemma') ?? '').trim();
  const definition = String(formData.get('definition') ?? '').trim();
  const exampleSentence = String(formData.get('exampleSentence') ?? '').trim();
  const topicId = String(formData.get('topicId') ?? '').trim();
  const levelId = String(formData.get('levelId') ?? '').trim();
  const ageGroupId = String(formData.get('ageGroupId') ?? '').trim();

  try {
    await apiSend('POST', '/admin/words/create', {
      lemma,
      definition,
      ...(exampleSentence ? { exampleSentence } : {}),
      topicId,
      ...(levelId ? { levelId } : {}),
      ...(ageGroupId ? { ageGroupId } : {}),
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
