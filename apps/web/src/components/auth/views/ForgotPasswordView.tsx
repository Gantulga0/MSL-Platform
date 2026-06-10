'use client';

import React, { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { translate as t } from '@/i18n';
import { forgotPasswordAction } from '@/lib/auth/actions';
import { localizeAuthError } from '@/lib/auth/errors';
import { AuthFormWrapper } from '../authModalStyles';
import { FormAlert } from '../FormAlert';
import type { AuthViewProps } from '../authModalTypes';

/**
 * Forgot-password view (S-04). Same styled design as login; requests a reset
 * email via the real `forgotPasswordAction` (enumeration-safe — always succeeds).
 * The actual reset is completed on the standalone `/reset-password` page reached
 * from the emailed link, so that flow stays a page (not a modal).
 */
export function ForgotPasswordView({ onSwitch, onClose }: AuthViewProps): React.ReactElement {
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
    <AuthFormWrapper>
      <div className="container">
        <button type="button" className="modal-close" onClick={onClose} aria-label={t('common.close')}>
          <X aria-hidden className="h-5 w-5" />
        </button>
        <div className="heading">{t('auth.forgotTitle')}</div>
        <form onSubmit={onSubmit} className="form" noValidate>
          {error && (
            <div className="alert">
              <FormAlert tone="error">{error}</FormAlert>
            </div>
          )}
          {success && (
            <div className="alert">
              <FormAlert tone="success">{success}</FormAlert>
            </div>
          )}
          <input
            required
            className="input"
            type="email"
            name="email"
            id="forgot-email"
            autoComplete="email"
            placeholder={t('auth.email')}
            aria-label={t('auth.email')}
          />
          <button className="login-button" type="submit" disabled={pending}>
            {t('auth.sendReset')}
          </button>
          <span className="switch-line">
            <button type="button" className="switch-link" onClick={() => onSwitch('login')}>
              {t('auth.backToLogin')}
            </button>
          </span>
        </form>
      </div>
    </AuthFormWrapper>
  );
}
