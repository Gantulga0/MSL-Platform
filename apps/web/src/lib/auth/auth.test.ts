import { extractSetCookie, homeForRole } from './constants';
import { localizeAuthError } from './errors';

describe('homeForRole', () => {
  it.each([
    ['admin', '/admin'],
    ['user', '/dictionary'],
    ['guest', '/dictionary'],
  ] as const)('routes %s to %s', (role, expected) => {
    expect(homeForRole(role)).toBe(expected);
  });
});

describe('extractSetCookie', () => {
  it('pulls a named cookie value from a Set-Cookie list', () => {
    const list = [
      'other=abc; Path=/',
      'refresh_token=xyz.123; Path=/; HttpOnly; SameSite=Lax',
    ];
    expect(extractSetCookie(list, 'refresh_token')).toBe('xyz.123');
  });

  it('returns undefined when the cookie is absent', () => {
    expect(extractSetCookie(['a=b'], 'refresh_token')).toBeUndefined();
  });
});

describe('localizeAuthError', () => {
  it('maps a known API message to a Mongolian string', () => {
    expect(localizeAuthError('Invalid credentials')).toBe('Имэйл эсвэл нууц үг буруу байна.');
  });

  it('falls back to a generic message when none is given', () => {
    expect(localizeAuthError(undefined)).toBe('Алдаа гарлаа. Дахин оролдоно уу.');
  });

  it('passes through an unknown message unchanged', () => {
    expect(localizeAuthError('Totally novel error')).toBe('Totally novel error');
  });
});
