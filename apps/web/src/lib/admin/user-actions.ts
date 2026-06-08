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

export async function createUserAction(formData: FormData): Promise<AdminActionResult> {
  const role = String(formData.get('role') ?? '');
  const displayName = String(formData.get('displayName') ?? '').trim();
  const username = String(formData.get('username') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const pin = String(formData.get('pin') ?? '').trim();

  const body: Record<string, unknown> = { role, displayName };
  if (role === 'learner') {
    body.username = username;
    if (pin) body.pin = pin;
  } else {
    body.email = email;
    body.password = password;
  }
  try {
    await apiSend('POST', '/users', body);
    revalidatePath('/admin/users');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateSettingAction(formData: FormData): Promise<AdminActionResult> {
  const key = String(formData.get('key') ?? '');
  const raw = String(formData.get('value') ?? '');
  // Parse JSON when possible (numbers, booleans, objects); else keep as string.
  let value: unknown = raw;
  try {
    value = JSON.parse(raw);
  } catch {
    /* keep string */
  }
  try {
    await apiSend('PATCH', '/admin/settings', { key, value });
    revalidatePath('/admin/settings');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
