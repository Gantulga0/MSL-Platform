'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Button, Field, Input } from '@msl/ui';
import { translate as t } from '@/i18n';
import { registerAction } from '@/lib/auth/actions';
import { localizeAuthError } from '@/lib/auth/errors';
import { FormAlert } from './FormAlert';

/** S-03 — email account registration with a required consent checkbox (AUTH-02). */
export function RegisterForm(): React.ReactElement {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(undefined);
    setSuccess(undefined);
    const data = new FormData(e.currentTarget);
    start(async () => {
      const res = await registerAction(data);
      if (res?.error) setError(localizeAuthError(res.error));
      else if (res?.message) setSuccess(res.message);
    });
  }

  if (success) {
    return (
      <div className="space-y-4">
        <FormAlert tone="success">{success}</FormAlert>
        <Link href={'/login' as Route} className="text-primary underline">
          {t('auth.backToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <FormAlert tone="error">{error}</FormAlert>}
      <Field label={t('auth.displayName')} required>
        <Input name="displayName" type="text" autoComplete="name" maxLength={120} required />
      </Field>
      <Field label={t('auth.email')} required>
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label={t('auth.password')} description={t('auth.passwordHint')} required>
        <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <label className="flex items-start gap-2 text-sm text-fg">
        <input name="consent" type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-primary" required />
        <span>{t('auth.consentLabel')}</span>
      </label>
      <Button type="submit" block loading={pending}>
        {t('auth.registerButton')}
      </Button>
      <p className="text-sm">
        {t('auth.haveAccount')}{' '}
        <Link href={'/login' as Route} className="text-primary underline">
          {t('auth.loginLink')}
        </Link>
      </p>
    </form>
  );
}
