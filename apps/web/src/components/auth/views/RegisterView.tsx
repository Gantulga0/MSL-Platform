'use client';

import React, { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { translate as t } from '@/i18n';
import { registerAction } from '@/lib/auth/actions';
import { localizeAuthError } from '@/lib/auth/errors';
import { AuthFormWrapper } from '../authModalStyles';
import { FormAlert } from '../FormAlert';
import { registerSchema, fieldErrors } from '@/lib/auth/schemas';
import type { AuthViewProps } from '../authModalTypes';

/**
 * Register view (email account, S-03). Same styled design as login; only the
 * fields and copy differ. Submit is wired to the real `registerAction` and the
 * required consent checkbox (AUTH-02) is preserved. On success an inline success
 * alert is shown with a switch back to login.
 */
export function RegisterView({ onSwitch, onClose }: AuthViewProps): React.ReactElement {
  const [error, setError] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string>();
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(undefined);
    setSuccess(undefined);
    const data = new FormData(e.currentTarget);
    const parsed = registerSchema.safeParse({
      displayName: String(data.get('displayName') ?? ''),
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
      consent: data.get('consent') === 'on',
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    start(async () => {
      const res = await registerAction(data);
      if (res?.error) setError(localizeAuthError(res.error));
      else if (res?.message) setSuccess(res.message);
    });
  }

  return (
    <AuthFormWrapper>
      <div className="container">
        <button type="button" className="modal-close" onClick={onClose} aria-label={t('common.close')}>
          <X aria-hidden className="h-5 w-5" />
        </button>
        <div className="heading">{t('auth.registerTitle')}</div>

        {success ? (
          <div className="form">
            <div className="alert">
              <FormAlert tone="success">{success}</FormAlert>
            </div>
            <span className="switch-line">
              <button type="button" className="switch-link" onClick={() => onSwitch('login')}>
                {t('auth.backToLogin')}
              </button>
            </span>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="form" noValidate>
            {error && (
              <div className="alert">
                <FormAlert tone="error">{error}</FormAlert>
              </div>
            )}
            <input
              className={`input${errors.displayName ? ' invalid' : ''}`}
              type="text"
              name="displayName"
              id="register-name"
              autoComplete="name"
              maxLength={120}
              placeholder={t('auth.displayName')}
              aria-label={t('auth.displayName')}
              aria-invalid={errors.displayName ? true : undefined}
              aria-describedby={errors.displayName ? 'register-name-error' : undefined}
            />
            {errors.displayName && (
              <span id="register-name-error" className="field-error">
                {errors.displayName}
              </span>
            )}
            <input
              className={`input${errors.email ? ' invalid' : ''}`}
              type="email"
              name="email"
              id="register-email"
              autoComplete="email"
              placeholder={t('auth.email')}
              aria-label={t('auth.email')}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'register-email-error' : undefined}
            />
            {errors.email && (
              <span id="register-email-error" className="field-error">
                {errors.email}
              </span>
            )}
            <input
              className={`input${errors.password ? ' invalid' : ''}`}
              type="password"
              name="password"
              id="register-password"
              autoComplete="new-password"
              minLength={8}
              placeholder={t('auth.password')}
              aria-label={t('auth.password')}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'register-password-error' : undefined}
            />
            {errors.password && (
              <span id="register-password-error" className="field-error">
                {errors.password}
              </span>
            )}
            <label className="consent">
              <input name="consent" type="checkbox" />
              <span>{t('auth.consentLabel')}</span>
            </label>
            {errors.consent && (
              <span id="register-consent-error" className="field-error">
                {errors.consent}
              </span>
            )}
            <button className="login-button" type="submit" disabled={pending}>
              {t('auth.registerButton')}
            </button>
            <span className="switch-line">
              {t('auth.haveAccount')}{' '}
              <button type="button" className="switch-link" onClick={() => onSwitch('login')}>
                {t('auth.loginLink')}
              </button>
            </span>
          </form>
        )}
      </div>
    </AuthFormWrapper>
  );
}
