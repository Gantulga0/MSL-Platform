import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  verify: jest.fn(),
}));

const verifyMock = argon2.verify as jest.Mock;

type AnyMock = jest.Mock;

function makeUser(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'u1',
    role: 'contributor',
    isMinor: false,
    displayName: 'Бат',
    username: null,
    email: 'bat@example.mn',
    schoolId: null,
    locale: 'mn',
    passwordHash: 'hashed',
    pinHash: null,
    status: 'active',
    emailVerifiedAt: new Date('2026-01-01'),
    failedLogins: 0,
    lockedUntil: null,
    deletedAt: null,
    ...overrides,
  };
}

interface Mocks {
  prisma: {
    user: { findUnique: AnyMock; findFirst: AnyMock; create: AnyMock; update: AnyMock };
    emailToken: { create: AnyMock; findFirst: AnyMock; update: AnyMock };
  };
  tokens: {
    issueAccessToken: AnyMock;
    issueRefreshToken: AnyMock;
    revokeAllForUser: AnyMock;
  };
  config: { get: AnyMock };
  audit: { record: AnyMock };
}

function build(): { service: AuthService; m: Mocks } {
  const m: Mocks = {
    prisma: {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      emailToken: { create: jest.fn().mockResolvedValue({}), findFirst: jest.fn(), update: jest.fn() },
    },
    tokens: {
      issueAccessToken: jest.fn().mockResolvedValue('access-token'),
      issueRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
      revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    },
    config: {
      get: jest.fn((key: string, def?: unknown) => {
        const map: Record<string, unknown> = {
          AUTH_MAX_FAILED_LOGINS: 5,
          AUTH_LOCKOUT_MINUTES: 15,
          NODE_ENV: 'test',
        };
        return key in map ? map[key] : def;
      }),
    },
    audit: { record: jest.fn().mockResolvedValue(undefined) },
  };
  const service = new AuthService(
    m.prisma as never,
    m.tokens as never,
    m.config as never,
    m.audit as never,
  );
  return { service, m };
}

describe('AuthService', () => {
  beforeEach(() => verifyMock.mockReset());

  describe('login', () => {
    it('issues tokens and resets failures on success (AUTH-02)', async () => {
      const { service, m } = build();
      m.prisma.user.findFirst.mockResolvedValue(makeUser());
      verifyMock.mockResolvedValue(true);

      const result = await service.login(
        { identifier: 'bat@example.mn', password: 'pw' },
        { ip: '127.0.0.1' },
      );

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe('bat@example.mn');
      expect(m.prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ failedLogins: 0 }) }),
      );
      expect(m.audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.login' }),
      );
    });

    it('rejects an unknown user without leaking existence', async () => {
      const { service, m } = build();
      m.prisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.login({ identifier: 'nobody@x.mn', password: 'pw' }, {}),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(m.audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.login.failed' }),
      );
    });

    it('increments the failure counter on a bad password (AUTH-05)', async () => {
      const { service, m } = build();
      m.prisma.user.findFirst.mockResolvedValue(makeUser({ failedLogins: 1 }));
      verifyMock.mockResolvedValue(false);

      await expect(
        service.login({ identifier: 'bat@example.mn', password: 'wrong' }, {}),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(m.prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ failedLogins: 2, lockedUntil: null }) }),
      );
    });

    it('locks the account after the max failed attempts (AUTH-05)', async () => {
      const { service, m } = build();
      m.prisma.user.findFirst.mockResolvedValue(makeUser({ failedLogins: 4 }));
      verifyMock.mockResolvedValue(false);

      await expect(
        service.login({ identifier: 'bat@example.mn', password: 'wrong' }, {}),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      const call = m.prisma.user.update.mock.calls[0][0];
      expect(call.data.failedLogins).toBe(5);
      expect(call.data.lockedUntil).toBeInstanceOf(Date);
    });

    it('refuses a currently locked account', async () => {
      const { service, m } = build();
      m.prisma.user.findFirst.mockResolvedValue(
        makeUser({ lockedUntil: new Date(Date.now() + 600_000) }),
      );
      await expect(
        service.login({ identifier: 'bat@example.mn', password: 'pw' }, {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refuses an unverified email account (AUTH-02)', async () => {
      const { service, m } = build();
      m.prisma.user.findFirst.mockResolvedValue(makeUser({ emailVerifiedAt: null }));
      verifyMock.mockResolvedValue(true);
      await expect(
        service.login({ identifier: 'bat@example.mn', password: 'pw' }, {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('register (enumeration-safe)', () => {
    it('does not create a duplicate but returns a generic message', async () => {
      const { service, m } = build();
      m.prisma.user.findUnique.mockResolvedValue(makeUser());
      const res = await service.register(
        { email: 'bat@example.mn', password: 'password1', displayName: 'Бат' },
        {},
      );
      expect(res.message).toMatch(/verify/i);
      expect(m.prisma.user.create).not.toHaveBeenCalled();
    });

    it('creates a contributor + verification token for a new email (G-2)', async () => {
      const { service, m } = build();
      m.prisma.user.findUnique.mockResolvedValue(null);
      m.prisma.user.create.mockResolvedValue(makeUser({ id: 'new' }));
      await service.register(
        { email: 'new@example.mn', password: 'password1', displayName: 'Шинэ' },
        {},
      );
      expect(m.prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: 'contributor' }) }),
      );
      expect(m.prisma.emailToken.create).toHaveBeenCalled();
    });
  });

  describe('forgotPassword (enumeration-safe)', () => {
    it('returns success and creates no token for an unknown email', async () => {
      const { service, m } = build();
      m.prisma.user.findUnique.mockResolvedValue(null);
      const res = await service.forgotPassword({ email: 'ghost@x.mn' });
      expect(res.message).toMatch(/if that email/i);
      expect(m.prisma.emailToken.create).not.toHaveBeenCalled();
    });
  });
});
