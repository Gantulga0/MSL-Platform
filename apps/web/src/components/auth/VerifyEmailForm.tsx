'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@msl/ui';
import { translate as t } from '@/i18n';
import { verifyEmailAction } from '@/lib/auth/actions';
import { localizeAuthError } from '@/lib/auth/errors';
import { FormAlert } from './FormAlert';

/** S-03/AUTH-02 — confirm an email-verification token. */
export function VerifyEmailForm({ token }: { token: string }): React.ReactElement {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [pending, start] = useTransition();

  if (!token) return <FormAlert tone="error">{t('auth.missingToken')}</FormAlert>;

  function verify(): void {
    setError(undefined);
    const data = new FormData();
    data.set('token', token);
    start(async () => {
      const res = await verifyEmailAction(data);
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
    <div className="space-y-4">
      {error && <FormAlert tone="error">{error}</FormAlert>}
      <Button type="button" block loading={pending} onClick={verify}>
        {pending ? t('auth.verifying') : t('auth.verifyButton')}
      </Button>
    </div>
  );
}
