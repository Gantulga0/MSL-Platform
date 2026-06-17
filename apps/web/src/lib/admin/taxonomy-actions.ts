'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { apiSend, ApiClientError, TAXONOMY_TAG } from '@/lib/api/server';

export interface ActionResult {
  error?: string;
}

function fail(e: unknown): ActionResult {
  return { error: e instanceof ApiClientError ? e.message : 'Request failed' };
}

/** Refresh the editor page AND purge every cached taxonomy read app-wide. */
function invalidateTaxonomy(): void {
  revalidatePath('/admin/topics');
  revalidateTag(TAXONOMY_TAG);
}

export async function createTopicAction(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const parentId = String(formData.get('parentId') ?? '').trim();
  try {
    await apiSend('POST', '/topics', { name, slug, ...(parentId ? { parentId } : {}) });
    invalidateTaxonomy();
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTopicAction(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '');
  try {
    await apiSend('DELETE', `/topics/${id}`);
    invalidateTaxonomy();
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function createLevelAction(formData: FormData): Promise<ActionResult> {
  const code = String(formData.get('code') ?? '').trim();
  const label = String(formData.get('label') ?? '').trim();
  try {
    await apiSend('POST', '/levels', { code, label });
    invalidateTaxonomy();
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function createAgeGroupAction(formData: FormData): Promise<ActionResult> {
  const code = String(formData.get('code') ?? '').trim();
  const label = String(formData.get('label') ?? '').trim();
  const minAge = String(formData.get('minAge') ?? '').trim();
  const maxAge = String(formData.get('maxAge') ?? '').trim();
  try {
    await apiSend('POST', '/age-groups', {
      code,
      label,
      ...(minAge ? { minAge: Number(minAge) } : {}),
      ...(maxAge ? { maxAge: Number(maxAge) } : {}),
    });
    invalidateTaxonomy();
    return {};
  } catch (e) {
    return fail(e);
  }
}
