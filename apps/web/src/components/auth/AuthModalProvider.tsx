'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { AuthModal } from './AuthModal';
import type { AuthView } from './authModalTypes';

interface AuthModalContextValue {
  open: (view: AuthView) => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }): React.ReactElement {
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

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within an AuthModalProvider');
  return ctx;
}
