'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Button, Field, Input } from '@msl/ui';
import { translate as t } from '@/i18n';
import { loginAction } from '@/lib/auth/actions';
import { localizeAuthError } from '@/lib/auth/errors';
import { FormAlert } from './FormAlert';

/** Login with email/username + password (minors use username + PIN in the password field). */
export function LoginForm(): React.ReactElement {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(undefined);
    const data = new FormData(e.currentTarget);
    start(async () => {
      const res = await loginAction(data);
      if (res?.error) setError(localizeAuthError(res.error));
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <FormAlert tone="error">{error}</FormAlert>}
      <Field label={t('auth.identifier')} required>
        <Input name="identifier" type="text" autoComplete="username" required />
      </Field>
      <Field label={t('auth.password')} required>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" block loading={pending}>
        {t('auth.loginButton')}
      </Button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href={'/forgot-password' as Route} className="text-primary underline">
          {t('auth.forgotPassword')}
        </Link>
        <span>
          {t('auth.noAccount')}{' '}
          <Link href={'/register' as Route} className="text-primary underline">
            {t('auth.registerLink')}
          </Link>
        </span>
      </div>
    </form>
  );
}
