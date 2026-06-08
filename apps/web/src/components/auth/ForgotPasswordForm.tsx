'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Button, Field, Input } from '@msl/ui';
import { translate as t } from '@/i18n';
import { forgotPasswordAction } from '@/lib/auth/actions';
import { localizeAuthError } from '@/lib/auth/errors';
import { FormAlert } from './FormAlert';

/** S-04 — request a password-reset email (enumeration-safe; always succeeds). */
export function ForgotPasswordForm(): React.ReactElement {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(undefined);
    setSuccess(undefined);
    const data = new FormData(e.currentTarget);
    start(async () => {
      const res = await forgotPasswordAction(data);
      if (res?.error) setError(localizeAuthError(res.error));
      else if (res?.message) setSuccess(res.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <FormAlert tone="error">{error}</FormAlert>}
      {success && <FormAlert tone="success">{success}</FormAlert>}
      <Field label={t('auth.email')} required>
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Button type="submit" block loading={pending}>
        {t('auth.sendReset')}
      </Button>
      <Link href={'/login' as Route} className="text-sm text-primary underline">
        {t('auth.backToLogin')}
      </Link>
    </form>
  );
}
