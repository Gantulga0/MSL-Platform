import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import type { Role } from '@msl/types';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/auth.types';

export const REFRESH_COOKIE = 'refresh_token';

interface TokenSubject {
  id: string;
  role: Role;
  isMinor: boolean;
}

interface RequestMeta {
  userAgent?: string | null;
  ip?: string | null;
}

@Injectable()
export class TokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issueAccessToken(user: TokenSubject): Promise<string> {
    const payload: JwtPayload = { sub: user.id, role: user.role, isMinor: user.isMinor };
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
    });
  }

  async issueRefreshToken(userId: string, meta: RequestMeta): Promise<string> {
    const raw = randomBytes(48).toString('base64url');
    const ttlMs = parseDurationMs(this.config.get<string>('JWT_REFRESH_TTL', '7d'));
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + ttlMs),
        userAgent: meta.userAgent ?? null,
        ip: meta.ip ?? null,
      },
    });
    return raw;
  }

  async rotateRefreshToken(
    raw: string,
    meta: RequestMeta,
  ): Promise<{ rawToken: string; user: TokenSubject }> {
    const existing = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: hashToken(raw) },
      include: { user: true },
    });
    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (existing.user.status !== 'active' || existing.user.deletedAt) {
      throw new UnauthorizedException('Account is not active');
    }

    const newRaw = randomBytes(48).toString('base64url');
    const ttlMs = parseDurationMs(this.config.get<string>('JWT_REFRESH_TTL', '7d'));
    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: existing.userId,
          tokenHash: hashToken(newRaw),
          expiresAt: new Date(Date.now() + ttlMs),
          userAgent: meta.userAgent ?? null,
          ip: meta.ip ?? null,
        },
      }),
    ]);

    return {
      rawToken: newRaw,
      user: {
        id: existing.user.id,
        role: existing.user.role,
        isMinor: existing.user.isMinor,
      },
    };
  }

  async revokeRefreshToken(raw: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  setRefreshCookie(res: Response, raw: string): void {
    const ttlMs = parseDurationMs(this.config.get<string>('JWT_REFRESH_TTL', '7d'));
    res.cookie(REFRESH_COOKIE, raw, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ttlMs,
    });
  }

  clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber)) return asNumber;
    throw new Error(`Invalid duration: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * unitMs[unit];
}
