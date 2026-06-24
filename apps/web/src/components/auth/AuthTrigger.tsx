'use client';

import React from 'react';
import { useAuthModal } from './AuthModalProvider';
import type { AuthView } from './authModalTypes';

export interface AuthTriggerProps {
  view: AuthView;
  className?: string;
  children: React.ReactNode;
}

export function AuthTrigger({ view, className, children }: AuthTriggerProps): React.ReactElement {
  const { open } = useAuthModal();
  return (
    <button type="button" onClick={() => open(view)} className={className}>
      {children}
    </button>
  );
}
