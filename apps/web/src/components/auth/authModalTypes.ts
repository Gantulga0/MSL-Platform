/** The three modal views that can be active in the auth modal. */
export type AuthView = 'login' | 'register' | 'forgot';

/** Props shared by every auth modal view. */
export interface AuthViewProps {
  /** Switch to another view without closing the modal (no navigation). */
  onSwitch: (view: AuthView) => void;
  /** Close the modal entirely. */
  onClose: () => void;
}
