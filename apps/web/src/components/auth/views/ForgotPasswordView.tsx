'use client';

import React, { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button, Field, Input } from '@msl/ui';
import { useT } from '@/i18n/client';
import { forgotPasswordAction } from '@/lib/auth/actions';
import { localizeAuthError } from '@/lib/auth/errors';
import { FormAlert } from '../FormAlert';
import type { AuthViewProps } from '../authModalTypes';

export function ForgotPasswordView({ onSwitch, onClose }: AuthViewProps): React.ReactElement {
  const t = useT();
  const reduce = useReducedMotion();
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
      if (res?.error) setError(localizeAuthError(res.error, t));
      else if (res?.message) setSuccess(res.message);
    });
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="glass glass-strong relative w-[min(26rem,92vw)] rounded-2xl p-6 sm:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('common.close')}
        className="absolute right-3 top-3 z-20 grid h-11 w-11 place-content-center rounded-full text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <X aria-hidden className="h-5 w-5" />
      </button>

      <h1 className="text-2xl font-bold tracking-tight text-fg">{t('auth.forgotTitle')}</h1>
      <p className="mt-1 text-sm text-fg-muted">{t('auth.forgotSubtitle')}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error && <FormAlert tone="error">{error}</FormAlert>}
        {success && <FormAlert tone="success">{success}</FormAlert>}

        <Field label={t('auth.email')} required>
          <Input name="email" type="email" autoComplete="email" inputMode="email" required />
        </Field>

        <Button type="submit" block size="lg" loading={pending}>
          {t('auth.sendReset')}
        </Button>

        <p className="text-center text-sm text-fg-muted">
          <button
            type="button"
            onClick={() => onSwitch('login')}
            className="font-semibold text-primary underline underline-offset-2"
          >
            {t('auth.backToLogin')}
          </button>
        </p>
      </form>
    </motion.div>
  );
}
