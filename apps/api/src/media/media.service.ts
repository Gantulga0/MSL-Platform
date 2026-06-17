import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { MediaAsset } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import type { AuthenticatedUser } from '../common/auth.types';
import type { CreateConsentDto, RegisterMediaDto, UploadedFile, UploadUrlDto } from './dto';

const EXT: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

export function assertAllowedMedia(
  mime: string,
  sizeBytes: number,
  allowed: string[],
  maxBytes: number,
): void {
  if (!allowed.includes(mime)) {
    throw new BadRequestException(`Unsupported media type: ${mime}`);
  }
  if (sizeBytes <= 0 || sizeBytes > maxBytes) {
    throw new BadRequestException(`File exceeds the ${maxBytes}-byte limit`);
  }
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  private allowedMime(): string[] {
    return this.config
      .get<string>('MEDIA_ALLOWED_MIME', 'video/mp4,video/webm,image/png,image/jpeg')
      .split(',')
      .map((m) => m.trim());
  }

  private maxBytes(): number {
    return this.config.get<number>('MEDIA_MAX_BYTES', 52_428_800);
  }

  createUploadDescriptor(dto: UploadUrlDto): {
    storageKey: string;
    uploadUrl: string;
    method: string;
    mode: string;
  } {
    assertAllowedMedia(dto.mime, dto.sizeBytes, this.allowedMime(), this.maxBytes());
    const key = `${dto.ownerType}/${randomUUID()}.${EXT[dto.mime] ?? 'bin'}`;
    return { storageKey: key, uploadUrl: '/api/v1/media', method: 'POST', mode: 'local-multipart' };
  }

  async upload(file: UploadedFile, dto: RegisterMediaDto, userId: string): Promise<MediaAsset> {
    if (!file) throw new BadRequestException('No file provided');
    assertAllowedMedia(file.mimetype, file.size, this.allowedMime(), this.maxBytes());
    const key = `${dto.ownerType}/${randomUUID()}.${EXT[file.mimetype] ?? 'bin'}`;
    await this.storage.save(key, file.buffer, file.mimetype);
    return this.prisma.mediaAsset.create({
      data: {
        ownerType: dto.ownerType,
        ownerId: dto.ownerId ?? '',
        type: dto.type,
        storageProvider: this.storage.provider,
        storageKey: key,
        mime: file.mimetype,
        sizeBytes: file.size,
        consentId: dto.consentId ?? null,
        uploadedBy: userId,
      },
    });
  }

  async getForRole(
    id: string,
    user?: AuthenticatedUser,
  ): Promise<{ id: string; type: string; mime: string; url: string }> {
    const media = await this.requireMedia(id);
    const isPublic = await this.isPublic(media);
    if (!isPublic) await this.assertCanViewPrivate(media, user);
    const url = await this.resolveUrl(media, isPublic);
    return { id: media.id, type: media.type, mime: media.mime, url };
  }

  private async resolveUrl(media: MediaAsset, isPublic: boolean): Promise<string> {
    if (media.storageProvider === 'r2') {
      if (isPublic) {
        const cdn = this.storage.publicUrl(media.storageKey);
        if (cdn) return cdn;
      } else {
        const ttl = this.config.get<number>('SIGNED_URL_TTL_SECONDS', 900);
        const signed = await this.storage.presignGet(media.storageKey, ttl);
        if (signed) return signed;
      }
    }
    return isPublic
      ? `/api/v1/media/${media.id}/blob`
      : `/api/v1/media/${media.id}/blob?token=${await this.signToken(media.id)}`;
  }

  async serveBlob(
    id: string,
    token: string | undefined,
  ): Promise<{ buffer: Buffer; mime: string }> {
    const media = await this.requireMedia(id);
    const isPublic = await this.isPublic(media);
    if (!isPublic) {
      const tokenOk = token ? await this.verifyToken(token, id) : false;
      if (!tokenOk) throw new ForbiddenException('A valid signed URL is required');
    }
    return { buffer: await this.storage.read(media.storageKey), mime: media.mime };
  }

  async remove(id: string): Promise<{ id: string }> {
    const media = await this.requireMedia(id);
    await this.storage.remove(media.storageKey);
    await this.prisma.mediaAsset.delete({ where: { id } });
    return { id };
  }

  createConsent(dto: CreateConsentDto, actorId: string): Promise<{ id: string }> {
    return this.prisma.consent.create({
      data: {
        subjectUserId: dto.subjectUserId ?? null,
        guardianUserId: dto.guardianUserId ?? actorId,
        scope: dto.scope,
        documentRef: dto.documentRef ?? null,
      },
      select: { id: true },
    });
  }

  private async requireMedia(id: string): Promise<MediaAsset> {
    const media = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  private async isPublic(media: MediaAsset): Promise<boolean> {
    if (media.ownerType === 'word') {
      const w = await this.prisma.word.findUnique({
        where: { id: media.ownerId },
        select: { status: true, deletedAt: true },
      });
      return w?.status === 'approved' && !w.deletedAt;
    }
    if (media.ownerType === 'word_variant') {
      const v = await this.prisma.wordVariant.findUnique({
        where: { id: media.ownerId },
        select: { word: { select: { status: true } } },
      });
      return v?.word.status === 'approved';
    }
    return false;
  }

  private async assertCanViewPrivate(media: MediaAsset, user?: AuthenticatedUser): Promise<void> {
    if (!user) throw new ForbiddenException('Authentication required');
    const isOwner = media.uploadedBy === user.id;
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) throw new ForbiddenException('Not allowed to view this media');
  }

  private signToken(mediaId: string): Promise<string> {
    const ttl = this.config.get<number>('SIGNED_URL_TTL_SECONDS', 900);
    return this.jwt.signAsync(
      { mid: mediaId, t: 'media' },
      { secret: this.config.get<string>('JWT_ACCESS_SECRET'), expiresIn: `${ttl}s` },
    );
  }

  private async verifyToken(token: string, mediaId: string): Promise<boolean> {
    try {
      const payload = await this.jwt.verifyAsync<{ mid: string; t: string }>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      return payload.t === 'media' && payload.mid === mediaId;
    } catch {
      return false;
    }
  }
}
