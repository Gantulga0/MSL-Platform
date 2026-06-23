'use client';

import React, { useEffect, useState } from 'react';
import { DialogShell } from '@msl/ui';
import { useT } from '@/i18n/client';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { ForgotPasswordView } from './views/ForgotPasswordView';
import type { AuthView } from './authModalTypes';

export interface AuthModalProps {
  /** Which view to open, or `null` when closed. */
  view: AuthView | null;
  /** Called when the modal should close (Esc, overlay click, or close button). */
  onClose: () => void;
}

const LABEL_KEY: Record<AuthView, string> = {
  login: 'auth.loginTitle',
  register: 'auth.registerTitle',
  forgot: 'auth.forgotTitle',
};

/**
 * Orchestrates the three auth views inside a single shared modal shell. The
 * parent controls open/close via `view`; switching between login/register/forgot
 * happens internally (no navigation). Form state resets automatically: switching
 * remounts the active view via `key`, and Radix unmounts the content on close so
 * reopening starts fresh.
 */
export function AuthModal({ view, onClose }: AuthModalProps): React.ReactElement {
  const t = useT();
  const [active, setActive] = useState<AuthView>(view ?? 'login');

  // When the parent opens the modal at a specific view, make it the active one.
  useEffect(() => {
    if (view) setActive(view);
  }, [view]);

  const props = { onSwitch: setActive, onClose };

  return (
    <DialogShell
      open={view !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      label={t(LABEL_KEY[active])}
    >
      {active === 'login' && <LoginView key="login" {...props} />}
      {active === 'register' && <RegisterView key="register" {...props} />}
      {active === 'forgot' && <ForgotPasswordView key="forgot" {...props} />}
    </DialogShell>
  );
}
