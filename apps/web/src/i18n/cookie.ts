/** Cookie that persists the visitor's chosen UI language. Shared by the client
 * LocaleSwitch (writes it) and the server getLocale (reads it); kept in its own
 * module so the client never pulls in `next/headers` via `./server`. */
export const LOCALE_COOKIE = 'msl-locale';
