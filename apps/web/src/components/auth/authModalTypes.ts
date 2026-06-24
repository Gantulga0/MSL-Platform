export type AuthView = 'login' | 'register' | 'forgot';

export interface AuthViewProps {
  onSwitch: (view: AuthView) => void;
  onClose: () => void;
}
