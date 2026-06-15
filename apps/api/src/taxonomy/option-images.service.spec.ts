import type { StorageService } from '../media/storage.service';
import type { UploadedFile } from '../media/dto';
import { OptionImagesService } from './option-images.service';

function file(mimetype: string): UploadedFile {
  return { originalname: 'x', mimetype, size: 10, buffer: Buffer.from('x') };
}

describe('OptionImagesService', () => {
  it('saves an uploaded image under options/<kind>/ and returns a public url', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const storage = { save, read: jest.fn() } as unknown as StorageService;
    const service = new OptionImagesService(storage);

    const url = await service.save('handedness', file('image/png'));

    expect(url).toMatch(/^\/api\/v1\/options\/images\/handedness\/[0-9a-f-]+\.png$/);
    expect(save).toHaveBeenCalledWith(expect.stringMatching(/^options\/handedness\/.+\.png$/), expect.any(Buffer));
  });

  it('rejects an unknown kind', async () => {
    const storage = { save: jest.fn(), read: jest.fn() } as unknown as StorageService;
    const service = new OptionImagesService(storage);
    await expect(service.save('handshapes', file('image/png'))).rejects.toThrow('Unknown option kind');
  });

  it('rejects an unsupported image type', async () => {
    const storage = { save: jest.fn(), read: jest.fn() } as unknown as StorageService;
    const service = new OptionImagesService(storage);
    await expect(service.save('handedness', file('application/pdf'))).rejects.toThrow('Unsupported image type');
  });

  it('serves a stored image with the MIME inferred from its extension', async () => {
    const read = jest.fn().mockResolvedValue(Buffer.from('svg'));
    const storage = { save: jest.fn(), read } as unknown as StorageService;
    const service = new OptionImagesService(storage);

    const { mime } = await service.serve('handedness', 'one.svg');

    expect(mime).toBe('image/svg+xml');
    expect(read).toHaveBeenCalledWith('options/handedness/one.svg');
  });
});
