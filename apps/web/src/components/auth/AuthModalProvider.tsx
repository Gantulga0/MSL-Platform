'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { AuthModal } from './AuthModal';
import type { AuthView } from './authModalTypes';

interface AuthModalContextValue {
  /** Open the auth modal at a given view (login / register / forgot). */
  open: (view: AuthView) => void;
  /** Close the auth modal. */
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

/**
 * App-wide host for the single auth modal. Mounted once near the root so any
 * component (the nav, the submit-word hint, the profile gate) can open it via
 * {@link useAuthModal} — there are no standalone /login or /register routes.
 */
export function AuthModalProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [view, setView] = useState<AuthView | null>(null);
  const open = useCallback((v: AuthView) => setView(v), []);
  const close = useCallback(() => setView(null), []);

  return (
    <AuthModalContext.Provider value={{ open, close }}>
      {children}
      <AuthModal view={view} onClose={close} />
    </AuthModalContext.Provider>
  );
}

/** Access the auth modal controls. Must be used under {@link AuthModalProvider}. */
export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within an AuthModalProvider');
  return ctx;
}
