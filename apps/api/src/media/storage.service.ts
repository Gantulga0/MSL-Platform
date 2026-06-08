import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Storage abstraction. Ships a local filesystem driver for dev; production swaps
 * in an S3-compatible driver with signed URLs (G-7, AUTH-09). The rest of the app
 * only depends on this interface.
 */
@Injectable()
export class StorageService {
  private readonly baseDir: string;

  constructor(private readonly config: ConfigService) {
    this.baseDir = resolve(config.get<string>('STORAGE_LOCAL_DIR', './storage'));
  }

  async save(key: string, data: Buffer): Promise<void> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  read(key: string): Promise<Buffer> {
    return readFile(this.pathFor(key));
  }

  async remove(key: string): Promise<void> {
    try {
      await unlink(this.pathFor(key));
    } catch {
      // already gone — fine
    }
  }

  /** Guards against path traversal in the storage key. */
  private pathFor(key: string): string {
    const safe = key.replace(/\.\.+/g, '').replace(/^[/\\]+/, '');
    return join(this.baseDir, safe);
  }
}
