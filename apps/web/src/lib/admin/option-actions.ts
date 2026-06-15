'use server';

import { revalidatePath } from 'next/cache';
import { API_BASE_URL } from '@/lib/api';
import { getAccessToken } from '@/lib/auth/session';

export interface OptionActionResult {
  error?: string;
  ok?: boolean;
}

/**
 * Upload a new handedness option image and create the option. Reuses the API's
 * storage-backed option upload endpoint.
 */
export async function uploadOptionAction(formData: FormData): Promise<OptionActionResult> {
  const kind = String(formData.get('kind') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim();
  const label = String(formData.get('label') ?? '').trim();
  const handCount = String(formData.get('handCount') ?? '').trim();
  const file = formData.get('file');

  if (!kind || !code || !label) return { error: 'Төрөл, код, нэр шаардлагатай.' };
  if (!(file instanceof File) || file.size === 0) return { error: 'Зураг шаардлагатай.' };
  if (kind === 'handedness' && !handCount) return { error: 'Гарын тоо шаардлагатай.' };

  const token = await getAccessToken();
  const fd = new FormData();
  fd.set('code', code);
  fd.set('label', label);
  if (handCount) fd.set('handCount', handCount);
  fd.set('file', file);

  const res = await fetch(`${API_BASE_URL}/options/${kind}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    return { error: body?.error?.message ?? 'Хадгалахад алдаа гарлаа.' };
  }
  revalidatePath('/admin/options');
  return { ok: true };
}
