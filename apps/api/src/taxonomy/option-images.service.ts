import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../media/storage.service';
import type { UploadedFile } from '../media/dto';

/** Option-image categories — each maps to a storage subfolder under options/. */
export const OPTION_KINDS = ['handedness'] as const;
export type OptionKind = (typeof OPTION_KINDS)[number];

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

/**
 * Stores and serves the handedness/handshape/position/movement option images in
 * the SAME storage as videos, under options/<kind>/. Reuses StorageService so we
 * don't introduce a second upload/storage path.
 */
@Injectable()
export class OptionImagesService {
  constructor(private readonly storage: StorageService) {}

  private assertKind(kind: string): asserts kind is OptionKind {
    if (!OPTION_KINDS.includes(kind as OptionKind)) {
      throw new NotFoundException(`Unknown option kind: ${kind}`);
    }
  }

  /** Read an option image's bytes + MIME for public serving. */
  async serve(kind: string, file: string): Promise<{ buffer: Buffer; mime: string }> {
    this.assertKind(kind);
    const mime = MIME_BY_EXT[extname(file).toLowerCase()];
    if (!mime) throw new NotFoundException('Unsupported image');
    try {
      const buffer = await this.storage.read(`options/${kind}/${file}`);
      return { buffer, mime };
    } catch {
      throw new NotFoundException('Image not found');
    }
  }

  /** Save an uploaded image and return its public imageUrl. */
  async save(kind: string, file: UploadedFile): Promise<string> {
    this.assertKind(kind);
    if (!file) throw new BadRequestException('No file provided');
    const ext = EXT_BY_MIME[file.mimetype];
    if (!ext) throw new BadRequestException(`Unsupported image type: ${file.mimetype}`);
    const name = `${randomUUID()}.${ext}`;
    await this.storage.save(`options/${kind}/${name}`, file.buffer);
    return `/api/v1/options/images/${kind}/${name}`;
  }
}
