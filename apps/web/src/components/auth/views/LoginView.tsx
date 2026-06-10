'use client';

import React, { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { translate as t } from '@/i18n';
import { loginAction } from '@/lib/auth/actions';
import { localizeAuthError } from '@/lib/auth/errors';
import { AuthFormWrapper } from '../authModalStyles';
import { FormAlert } from '../FormAlert';
import { loginSchema, fieldErrors } from '@/lib/auth/schemas';
import type { AuthViewProps } from '../authModalTypes';

/**
 * Login view (email/username + password). Same styled design as the original
 * standalone login; submit is wired to the real `loginAction` (which sets the
 * session cookie and redirects on success). The identifier field is named
 * `identifier` to match the action's contract (minors use username + PIN).
 */
export function LoginView({ onSwitch, onClose }: AuthViewProps): React.ReactElement {
  const [error, setError] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    <AuthFormWrapper>
      <div className="container">
        <button type="button" className="modal-close" onClick={onClose} aria-label={t('common.close')}>
          <X aria-hidden className="h-5 w-5" />
        </button>
        <div className="heading">{t('auth.loginTitle')}</div>
        <form onSubmit={onSubmit} className="form" noValidate>
          {error && (
            <div className="alert">
              <FormAlert tone="error">{error}</FormAlert>
            </div>
          )}
          <input
            className={`input${errors.identifier ? ' invalid' : ''}`}
            type="text"
            name="identifier"
            id="login-identifier"
            autoComplete="username"
            placeholder={t('auth.identifier')}
            aria-label={t('auth.identifier')}
            aria-invalid={errors.identifier ? true : undefined}
            aria-describedby={errors.identifier ? 'login-identifier-error' : undefined}
          />
          {errors.identifier && (
            <span id="login-identifier-error" className="field-error">
              {errors.identifier}
            </span>
          )}
          <input
            className={`input${errors.password ? ' invalid' : ''}`}
            type="password"
            name="password"
            id="login-password"
            autoComplete="current-password"
            placeholder={t('auth.password')}
            aria-label={t('auth.password')}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
          />
          {errors.password && (
            <span id="login-password-error" className="field-error">
              {errors.password}
            </span>
          )}
          <span className="forgot-password">
            <button type="button" className="switch-link" onClick={() => onSwitch('forgot')}>
              {t('auth.forgotPassword')}
            </button>
          </span>
          <button className="login-button" type="submit" disabled={pending}>
            {t('auth.loginButton')}
          </button>
          <span className="switch-line">
            {t('auth.noAccount')}{' '}
            <button type="button" className="switch-link" onClick={() => onSwitch('register')}>
              {t('auth.registerLink')}
            </button>
          </span>
        </form>
      </div>
    </AuthFormWrapper>
  );
}
