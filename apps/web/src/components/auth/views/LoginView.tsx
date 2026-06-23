'use client';

import React, { useState, useTransition } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button, Field, Input } from '@msl/ui';
import { translate as t } from '@/i18n';
import { loginAction } from '@/lib/auth/actions';
import { localizeAuthError } from '@/lib/auth/errors';
import { FormAlert } from '../FormAlert';
import { loginSchema, fieldErrors } from '@/lib/auth/schemas';
import type { AuthViewProps } from '../authModalTypes';

/**
 * Login view (email/username + password). Rebuilt on the shared Tailwind tokens +
 * primitives to match the rest of the app. Submit is wired to the real
 * `loginAction` (sets the session cookie, redirects on success). The identifier
 * field is named `identifier` to match the action's contract (minors use
 * username + PIN). Honours reduced-motion (NFR-01).
 */
export function LoginView({ onSwitch, onClose }: AuthViewProps): React.ReactElement {
  const reduce = useReducedMotion();
  const [error, setError] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(undefined);
    const data = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      identifier: String(data.get('identifier') ?? ''),
      password: String(data.get('password') ?? ''),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    start(async () => {
      const res = await loginAction(data);
      if (res?.error) setError(localizeAuthError(res.error));
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

      <h1 className="text-2xl font-bold tracking-tight text-fg">{t('auth.loginTitle')}</h1>
      <p className="mt-1 text-sm text-fg-muted">{t('auth.loginSubtitle')}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error && <FormAlert tone="error">{error}</FormAlert>}

        <Field label={t('auth.identifier')} required error={errors.identifier}>
          <Input name="identifier" autoComplete="username" />
        </Field>

        <Field label={t('auth.password')} required error={errors.password}>
          <div className="relative">
            <Input
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
              aria-pressed={showPw}
              className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-content-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              {showPw ? <EyeOff aria-hidden className="h-5 w-5" /> : <Eye aria-hidden className="h-5 w-5" />}
            </button>
          </div>
        </Field>

        <div className="text-right">
          <button
            type="button"
            onClick={() => onSwitch('forgot')}
            className="text-sm font-medium text-primary underline underline-offset-2"
          >
            {t('auth.forgotPassword')}
          </button>
        </div>

        <Button type="submit" block size="lg" loading={pending}>
          {t('auth.loginButton')}
        </Button>

        <p className="text-center text-sm text-fg-muted">
          {t('auth.noAccount')}{' '}
          <button
            type="button"
            onClick={() => onSwitch('register')}
            className="font-semibold text-primary underline underline-offset-2"
          >
            {t('auth.registerLink')}
          </button>
        </p>
      </form>
    </motion.div>
  );
}
