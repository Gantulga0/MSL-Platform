'use client';

import { useState, useTransition } from 'react';
import { Button, Field, Input } from '@msl/ui';
import { useT } from '@/i18n/client';
import { resetPasswordAction } from '@/lib/auth/actions';
import { localizeAuthError } from '@/lib/auth/errors';
import { FormAlert } from './FormAlert';
import { AuthTrigger } from './AuthTrigger';

/** S-04 — complete a password reset using the emailed token. */
export function ResetPasswordForm({ token }: { token: string }): React.ReactElement {
  const t = useT();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [pending, start] = useTransition();

  if (!token) return <FormAlert tone="error">{t('auth.missingToken')}</FormAlert>;

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(undefined);
    const data = new FormData(e.currentTarget);
    start(async () => {
      const res = await resetPasswordAction(data);
      if (res?.error) setError(localizeAuthError(res.error, t));
      else if (res?.message) setSuccess(res.message);
    });
  }

  if (success) {
    return (
      <div className="space-y-4">
        <FormAlert tone="success">{success}</FormAlert>
        <AuthTrigger view="login" className="text-primary underline">
          {t('auth.backToLogin')}
        </AuthTrigger>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <FormAlert tone="error">{error}</FormAlert>}
      <input type="hidden" name="token" value={token} />
      <Field label={t('auth.newPassword')} description={t('auth.passwordHint')} required>
        <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <Button type="submit" block loading={pending}>
        {t('auth.resetButton')}
      </Button>
    </form>
  );
}
