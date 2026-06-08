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

export function localizeAuthError(message?: string): string {
  if (!message) return translate('auth.err.generic');
  const key = MESSAGE_KEYS[message];
  return key ? translate(key) : message;
}
