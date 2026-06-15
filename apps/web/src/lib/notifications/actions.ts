'use server';

import { revalidatePath } from 'next/cache';
import { apiSend, ApiClientError } from '@/lib/api/server';

export interface NotificationItem {
  id: string;
  type: 'review_pending' | 'clarification' | 'approved' | 'rejected' | 'system';
  payload: {
    submissionId?: string;
    wordId?: string;
    lemma?: string;
    comment?: string | null;
  };
  readAt: string | null;
  createdAt: string;
}

export interface NotifActionResult {
  error?: string;
  ok?: boolean;
}

function fail(e: unknown): NotifActionResult {
  return { error: e instanceof ApiClientError ? e.message : 'Үйлдэл амжилтгүй боллоо.' };
}

export async function markNotificationReadAction(id: string): Promise<NotifActionResult> {
  try {
    await apiSend('POST', `/notifications/${id}/read`);
    revalidatePath('/admin/notifications');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function markAllNotificationsReadAction(): Promise<NotifActionResult> {
  try {
    await apiSend('POST', '/notifications/read-all');
    revalidatePath('/admin/notifications');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
