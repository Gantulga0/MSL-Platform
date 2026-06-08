import { BadRequestException } from '@nestjs/common';
import { assertAllowedMedia } from './media.service';

const ALLOWED = ['video/mp4', 'video/webm', 'image/png', 'image/jpeg'];
const MAX = 52_428_800;

describe('assertAllowedMedia (G-7)', () => {
  it('accepts an allowed type within the size cap', () => {
    expect(() => assertAllowedMedia('video/mp4', 4_000_000, ALLOWED, MAX)).not.toThrow();
  });

  it('rejects a disallowed MIME type', () => {
    expect(() => assertAllowedMedia('application/x-msdownload', 1000, ALLOWED, MAX)).toThrow(
      BadRequestException,
    );
  });

  it('rejects a file over the size cap', () => {
    expect(() => assertAllowedMedia('video/mp4', MAX + 1, ALLOWED, MAX)).toThrow(BadRequestException);
  });

  it('rejects an empty file', () => {
    expect(() => assertAllowedMedia('image/png', 0, ALLOWED, MAX)).toThrow(BadRequestException);
  });
});
