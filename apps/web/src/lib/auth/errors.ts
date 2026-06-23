import { translate } from '@/i18n';

/**
 * Maps the API's (English) auth error messages to localized UI strings (NFR-10).
 * The API envelope keeps messages in English by contract; the UI localizes them.
 * Unknown messages fall through to the raw text so nothing is swallowed.
 */
const MESSAGE_KEYS: Record<string, string> = {
  'Invalid credentials': 'auth.err.invalidCredentials',
  'Invalid learner credentials': 'auth.err.invalidCredentials',
  'Account temporarily locked. Try again later.': 'auth.err.locked',
  'Email not verified': 'auth.err.emailNotVerified',
  'Account is suspended': 'auth.err.suspended',
};

/**
 * Pass the active-locale translator (`t` from `useT()`) so messages localize to
 * the visitor's chosen language. Defaults to the mn-bound `translate` so the
 * pure-function tests (and any non-component caller) keep working.
 */
export function localizeAuthError(
  message?: string,
  t: (key: string) => string = (key) => translate(key),
): string {
  if (!message) return t('auth.err.generic');
  const key = MESSAGE_KEYS[message];
  return key ? t(key) : message;
}
