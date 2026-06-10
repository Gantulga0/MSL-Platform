'use client';

import React from 'react';
import { useAuthModal } from './AuthModalProvider';
import type { AuthView } from './authModalTypes';

export interface AuthTriggerProps {
  /** Which auth view to open. */
  view: AuthView;
  className?: string;
  children: React.ReactNode;
}

/**
 * Inline, link-styled control that opens the auth modal. Replaces the former
 * standalone /login and /register links in server-rendered pages (a button so it
 * is keyboard-operable and announced as an action, not a navigation).
 */
export function AuthTrigger({ view, className, children }: AuthTriggerProps): React.ReactElement {
  const { open } = useAuthModal();
  return (
    <button type="button" onClick={() => open(view)} className={className}>
      {children}
    </button>
  );
}
