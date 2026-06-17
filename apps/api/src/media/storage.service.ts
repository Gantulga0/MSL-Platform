import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type StorageProvider = 'local' | 'r2';

function safeKey(key: string): string {
  return key.replace(/\.\.+/g, '').replace(/^[/\\]+/, '');
}

interface StorageDriver {
  readonly provider: StorageProvider;
  save(key: string, data: Buffer, mime?: string): Promise<void>;
  read(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
  publicUrl(key: string): string | null;
  presignGet(key: string, ttlSeconds: number): Promise<string | null>;
}

class LocalDriver implements StorageDriver {
  readonly provider = 'local' as const;
  private readonly baseDir: string;

  constructor(config: ConfigService) {
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

  publicUrl(): string | null {
    return null;
  }

  presignGet(): Promise<string | null> {
    return Promise.resolve(null);
  }

  private pathFor(key: string): string {
    return join(this.baseDir, safeKey(key));
  }
}

class R2Driver implements StorageDriver {
  readonly provider = 'r2' as const;
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBase: string | null;

  constructor(config: ConfigService) {
    const accountId = config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('R2_SECRET_ACCESS_KEY');
    const bucket = config.get<string>('R2_BUCKET');
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        'STORAGE_DRIVER=r2 requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET',
      );
    }
    this.bucket = bucket;
    this.publicBase = config.get<string>('R2_PUBLIC_BASE_URL')?.replace(/\/$/, '') || null;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async save(key: string, data: Buffer, mime?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: safeKey(key),
        Body: data,
        ContentType: mime,
      }),
    );
  }

  async read(key: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: safeKey(key) }),
    );
    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }

  async remove(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: safeKey(key) }));
  }

  publicUrl(key: string): string | null {
    return this.publicBase ? `${this.publicBase}/${safeKey(key)}` : null;
  }

  presignGet(key: string, ttlSeconds: number): Promise<string | null> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: safeKey(key) }),
      { expiresIn: ttlSeconds },
    );
  }
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: StorageDriver;

  constructor(config: ConfigService) {
    const which = config.get<string>('STORAGE_DRIVER', 'local').toLowerCase();
    this.driver = which === 'r2' ? new R2Driver(config) : new LocalDriver(config);
    this.logger.log(`Storage driver: ${this.driver.provider}`);
  }

  get provider(): StorageProvider {
    return this.driver.provider;
  }

  save(key: string, data: Buffer, mime?: string): Promise<void> {
    return this.driver.save(key, data, mime);
  }

  read(key: string): Promise<Buffer> {
    return this.driver.read(key);
  }

  remove(key: string): Promise<void> {
    return this.driver.remove(key);
  }

  publicUrl(key: string): string | null {
    return this.driver.publicUrl(key);
  }

  presignGet(key: string, ttlSeconds: number): Promise<string | null> {
    return this.driver.presignGet(key, ttlSeconds);
  }
}
