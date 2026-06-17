import { createHash, randomBytes } from 'node:crypto';
import { ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import type { User } from '@prisma/client';
import type { Role } from '@msl/types';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { TokensService, parseDurationMs } from './tokens.service';
import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './auth.dto';

export interface PublicUser {
  id: string;
  role: Role;
  displayName: string;
  username: string | null;
  email: string | null;
  isMinor: boolean;
  locale: string;
  emailVerified: boolean;
}

interface RequestMeta {
  userAgent?: string | null;
  ip?: string | null;
}

const EMAIL_TOKEN_TTL = '24h';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta): Promise<{ message: string }> {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      this.logger.warn(`Registration attempt for existing email`);
      return { message: 'Registration received. Check your email to verify your account.' };
    }

    const passwordHash = await argon2.hash(dto.password);

    const autoVerify = !this.mail.enabled;

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'user',
        displayName: dto.displayName,
        isMinor: false,
        locale: 'mn',
        ...(autoVerify ? { emailVerifiedAt: new Date() } : {}),
      },
    });

    if (!autoVerify) {
      const token = await this.issueEmailToken(user.id, 'verify_email');
      await this.mail.sendVerificationEmail(email, token);
    }
    await this.audit.record({
      actorId: user.id,
      entityType: 'user',
      entityId: user.id,
      action: 'auth.register',
      ip: meta.ip,
    });
    return {
      message: autoVerify
        ? 'Registration complete — email auto-verified. You can sign in now.'
        : 'Registration received. Check your email to verify your account.',
    };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const record = await this.consumeEmailToken(dto.token, 'verify_email');
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await this.audit.record({
      actorId: record.userId,
      entityType: 'user',
      entityId: record.userId,
      action: 'auth.verify_email',
    });
    return { message: 'Email verified. You can now sign in.' };
  }

  async login(
    dto: LoginDto,
    meta: RequestMeta,
  ): Promise<{ accessToken: string; refreshToken: string; user: PublicUser }> {
    const identifier = dto.identifier.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: dto.identifier }],
        deletedAt: null,
      },
    });

    if (!user) {
      await this.recordFailedLogin(null, meta);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.assertNotLocked(user);
    if (user.status !== 'active') {
      throw new ForbiddenException('Account is suspended');
    }

    let ok = false;
    if (user.isMinor && user.pinHash) {
      ok = await argon2.verify(user.pinHash, dto.password);
    } else if (user.passwordHash) {
      ok = await argon2.verify(user.passwordHash, dto.password);
    }
    if (!ok) {
      await this.registerFailedAttempt(user, meta);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isMinor && !user.emailVerifiedAt) {
      throw new ForbiddenException('Email not verified');
    }

    return this.completeLogin(user, meta, 'auth.login');
  }

  async refresh(
    rawToken: string | undefined,
    meta: RequestMeta,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!rawToken) throw new UnauthorizedException('Missing refresh token');
    const { rawToken: newRefresh, user } = await this.tokens.rotateRefreshToken(rawToken, meta);
    const accessToken = await this.tokens.issueAccessToken(user);
    return { accessToken, refreshToken: newRefresh };
  }

  async logout(
    rawToken: string | undefined,
    actorId: string | undefined,
    meta: RequestMeta,
  ): Promise<void> {
    if (rawToken) await this.tokens.revokeRefreshToken(rawToken);
    await this.audit.record({
      actorId: actorId ?? null,
      entityType: 'user',
      entityId: actorId ?? null,
      action: 'auth.logout',
      ip: meta.ip,
    });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.passwordHash) {
      const token = await this.issueEmailToken(user.id, 'reset_password');
      await this.mail.sendPasswordResetEmail(email, token);
    }
    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const record = await this.consumeEmailToken(dto.token, 'reset_password');
    const passwordHash = await argon2.hash(dto.password);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, failedLogins: 0, lockedUntil: null },
    });
    await this.tokens.revokeAllForUser(record.userId);
    await this.audit.record({
      actorId: record.userId,
      entityType: 'user',
      entityId: record.userId,
      action: 'auth.reset_password',
    });
    return { message: 'Password updated. Please sign in.' };
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new UnauthorizedException('Account not found');
    return toPublicUser(user);
  }

  private async completeLogin(
    user: User,
    meta: RequestMeta,
    action: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: PublicUser }> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    const subject = { id: user.id, role: user.role, isMinor: user.isMinor };
    const accessToken = await this.tokens.issueAccessToken(subject);
    const refreshToken = await this.tokens.issueRefreshToken(user.id, meta);
    await this.audit.record({
      actorId: user.id,
      entityType: 'user',
      entityId: user.id,
      action,
      ip: meta.ip,
    });
    return { accessToken, refreshToken, user: toPublicUser(user) };
  }

  private assertNotLocked(user: User): void {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account temporarily locked. Try again later.');
    }
  }

  private async registerFailedAttempt(user: User, meta: RequestMeta): Promise<void> {
    const max = this.config.get<number>('AUTH_MAX_FAILED_LOGINS', 5);
    const lockMinutes = this.config.get<number>('AUTH_LOCKOUT_MINUTES', 15);
    const failedLogins = user.failedLogins + 1;
    const lockedUntil =
      failedLogins >= max ? new Date(Date.now() + lockMinutes * 60_000) : user.lockedUntil;
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLogins, lockedUntil },
    });
    await this.recordFailedLogin(user.id, meta);
  }

  private async recordFailedLogin(userId: string | null, meta: RequestMeta): Promise<void> {
    await this.audit.record({
      actorId: userId,
      entityType: 'user',
      entityId: userId,
      action: 'auth.login.failed',
      ip: meta.ip,
    });
  }

  private async issueEmailToken(
    userId: string,
    purpose: 'verify_email' | 'reset_password',
  ): Promise<string> {
    const raw = randomBytes(32).toString('base64url');
    await this.prisma.emailToken.create({
      data: {
        userId,
        tokenHash: hashToken(raw),
        purpose,
        expiresAt: new Date(Date.now() + parseDurationMs(EMAIL_TOKEN_TTL)),
      },
    });
    if (this.config.get<string>('NODE_ENV') !== 'production') {
      this.logger.log(`[dev] ${purpose} token for ${userId}: ${raw}`);
    }
    return raw;
  }

  private async consumeEmailToken(
    raw: string,
    purpose: 'verify_email' | 'reset_password',
  ): Promise<{ userId: string }> {
    const record = await this.prisma.emailToken.findFirst({
      where: { tokenHash: hashToken(raw), purpose },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    await this.prisma.emailToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return { userId: record.userId };
  }
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    role: user.role,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    isMinor: user.isMinor,
    locale: user.locale,
    emailVerified: user.emailVerifiedAt !== null,
  };
}
