import type { PrismaService } from '../prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { StorageService } from '../media/storage.service';
import type { MediaService } from '../media/media.service';
import { normalizeLemma } from '../common/normalize';
import { AdminService } from './admin.service';

function makePrisma(existing: { topicId: string; normalizedLemma: string }[]) {
  let n = 0;
  const wordCreate = jest.fn(async () => ({ id: `w${++n}` }));
  const mediaCreate = jest.fn(async () => ({ id: 'm1' }));
  const tx = { word: { create: wordCreate }, mediaAsset: { create: mediaCreate } };
  const prisma = {
    topic: {
      findMany: jest.fn().mockResolvedValue([{ id: 'topic-family', slug: 'family' }]),
      findFirst: jest.fn().mockResolvedValue({ id: 'topic-family' }),
    },
    word: { findMany: jest.fn().mockResolvedValue(existing) },
    importJob: { create: jest.fn().mockResolvedValue({ id: 'job1' }) },
    $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
  } as unknown as PrismaService;
  return { prisma, wordCreate, mediaCreate };
}

const audit = { record: jest.fn() } as unknown as AuditService;
const storage = { provider: 'local', publicUrl: () => null } as unknown as StorageService;
const media = { upload: jest.fn(), remove: jest.fn() } as unknown as MediaService;

describe('AdminService.bulkImport', () => {
  it('imports rows with a videoUrl and flags duplicate/missing-video rows', async () => {
    const { prisma, wordCreate, mediaCreate } = makePrisma([]);
    const service = new AdminService(prisma, audit, storage, media);

    const result = await service.bulkImport(
      {
        status: 'approved',
        words: [
          { lemma: 'Ээж', topicSlug: 'family', videoUrl: 'https://cdn.example.com/eej.mp4' },
          { lemma: 'Аав', topicSlug: 'family', videoUrl: 'https://cdn.example.com/aav.mp4' },
          { lemma: 'Ээж', topicSlug: 'family', videoUrl: 'https://cdn.example.com/eej2.mp4' },
          { lemma: 'Эгч', topicSlug: 'family' },
        ],
      },
      'admin-1',
    );

    expect(result).toEqual({
      total: 4,
      success: 2,
      errors: [
        { row: 3, reason: 'duplicate' },
        { row: 4, reason: 'videoUrl required' },
      ],
    });
    expect(wordCreate).toHaveBeenCalledTimes(2);
    expect(mediaCreate).toHaveBeenCalledTimes(2);
    expect(mediaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerType: 'word',
          type: 'video',
          publicUrl: 'https://cdn.example.com/eej.mp4',
        }),
      }),
    );
  });

  it('flags a row with an invalid videoUrl', async () => {
    const { prisma, wordCreate } = makePrisma([]);
    const service = new AdminService(prisma, audit, storage, media);

    const result = await service.bulkImport(
      { status: 'pending', words: [{ lemma: 'Ном', topicSlug: 'family', videoUrl: 'not-a-url' }] },
      'admin-1',
    );

    expect(result).toEqual({
      total: 1,
      success: 0,
      errors: [{ row: 1, reason: 'invalid videoUrl' }],
    });
    expect(wordCreate).not.toHaveBeenCalled();
  });

  it('flags a row that duplicates an existing word in the same topic', async () => {
    const { prisma, wordCreate } = makePrisma([
      { topicId: 'topic-family', normalizedLemma: normalizeLemma('Ээж') },
    ]);
    const service = new AdminService(prisma, audit, storage, media);

    const result = await service.bulkImport(
      {
        status: 'approved',
        words: [{ lemma: 'Ээж', topicSlug: 'family', videoUrl: 'https://cdn.example.com/eej.mp4' }],
      },
      'admin-1',
    );

    expect(result).toEqual({ total: 1, success: 0, errors: [{ row: 1, reason: 'duplicate' }] });
    expect(wordCreate).not.toHaveBeenCalled();
  });
});

describe('AdminService.bulkImportFiles', () => {
  it('uploads each video to storage and creates a word, matching files by name', async () => {
    const wordCreate = jest.fn(async () => ({ id: 'w1' }));
    const mediaUpdate = jest.fn();
    const tx = { word: { create: wordCreate }, mediaAsset: { update: mediaUpdate } };
    const prisma = {
      topic: {
        findMany: jest.fn().mockResolvedValue([{ id: 'topic-family', slug: 'family' }]),
        findFirst: jest.fn().mockResolvedValue({ id: 'topic-family' }),
      },
      word: { findMany: jest.fn().mockResolvedValue([]) },
      importJob: { create: jest.fn().mockResolvedValue({ id: 'job1' }) },
      $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
    } as unknown as PrismaService;

    const upload = jest
      .fn()
      .mockResolvedValue({ id: 'm1', storageProvider: 'r2', storageKey: 'word/m1.mp4' });
    const mediaSvc = { upload, remove: jest.fn() } as unknown as MediaService;
    const service = new AdminService(prisma, audit, storage, mediaSvc);

    const file = {
      originalname: 'eej.mp4',
      mimetype: 'video/mp4',
      size: 10,
      buffer: Buffer.from('x'),
    };
    const result = await service.bulkImportFiles(
      [file],
      [
        { lemma: 'Ээж', topicSlug: 'family', file: 'eej.mp4' },
        { lemma: 'Аав', topicSlug: 'family', file: 'missing.mp4' },
      ],
      'approved',
      'admin-1',
    );

    expect(result).toEqual({
      total: 2,
      success: 1,
      errors: [{ row: 2, reason: 'video file not found: missing.mp4' }],
    });
    expect(upload).toHaveBeenCalledTimes(1);
    expect(wordCreate).toHaveBeenCalledTimes(1);
    // Falls back to the API blob URL when no CDN base is configured.
    expect(mediaUpdate).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { ownerId: 'w1', publicUrl: '/api/v1/media/m1/blob' },
    });
  });
});

describe('AdminService.createWord', () => {
  it('requires a sign video and re-parents it onto the new word', async () => {
    const mediaUpdate = jest.fn().mockResolvedValue({ id: 'media-1' });
    const wordCreate = jest
      .fn()
      .mockResolvedValue({ id: 'word-1', lemma: 'ээж', status: 'approved' });
    const prisma = {
      word: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: wordCreate,
      },
      mediaAsset: {
        findMany: jest.fn().mockResolvedValue([{ id: 'media-1', type: 'video' }]),
        update: mediaUpdate,
      },
    } as unknown as PrismaService;
    const service = new AdminService(prisma, audit, storage, media);

    const result = await service.createWord(
      { lemma: 'Ээж', topicId: 'topic-1', mediaIds: ['media-1'] },
      'admin-1',
    );

    expect(result).toEqual({ id: 'word-1' });
    // Lemma is stored lowercased.
    expect(wordCreate.mock.calls[0][0].data.lemma).toBe('ээж');
    expect(mediaUpdate).toHaveBeenCalledWith({
      where: { id: 'media-1' },
      data: { ownerId: 'word-1', publicUrl: '/api/v1/media/media-1/blob' },
    });
  });

  it('rejects word creation when no video is supplied', async () => {
    const wordCreate = jest.fn();
    const prisma = {
      word: { create: wordCreate },
      mediaAsset: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
    } as unknown as PrismaService;
    const service = new AdminService(prisma, audit, storage, media);

    await expect(
      service.createWord({ lemma: 'Ээж', topicId: 'topic-1' }, 'admin-1'),
    ).rejects.toThrow('sign video is required');
    expect(wordCreate).not.toHaveBeenCalled();
  });

  it('rejects a duplicate lemma in the same topic', async () => {
    const wordCreate = jest.fn();
    const prisma = {
      word: {
        findFirst: jest.fn().mockResolvedValue({ id: 'existing-word' }),
        create: wordCreate,
      },
      mediaAsset: {
        findMany: jest.fn().mockResolvedValue([{ id: 'media-1', type: 'video' }]),
        update: jest.fn(),
      },
    } as unknown as PrismaService;
    const service = new AdminService(prisma, audit, storage, media);

    await expect(
      service.createWord({ lemma: 'Ээж', topicId: 'topic-1', mediaIds: ['media-1'] }, 'admin-1'),
    ).rejects.toThrow('аль хэдийн бүртгэгдсэн');
    expect(wordCreate).not.toHaveBeenCalled();
  });
});

describe('AdminService.approveSubmission', () => {
  const submission = {
    id: 'sub-1',
    status: 'pending',
    proposedLemma: 'Ээж',
    proposedDefinition: '',
    exampleSentence: null,
    submittedBy: 'user-1',
    topicId: null,
    levelId: null,
    ageGroupId: null,
  };

  function makePrisma() {
    const wordCreate = jest
      .fn()
      .mockResolvedValue({ id: 'word-1', lemma: 'Ээж', status: 'approved' });
    const tx = {
      word: { create: wordCreate },
      mediaAsset: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
      submission: { update: jest.fn() },
      review: { create: jest.fn() },
      notification: { create: jest.fn(), deleteMany: jest.fn() },
    };
    const prisma = {
      submission: { findUnique: jest.fn().mockResolvedValue(submission) },
      $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
    } as unknown as PrismaService;
    return { prisma, wordCreate };
  }

  const fullDto = {
    topicId: 'topic-1',
    ageGroupId: 'age-1',
    levelId: 'level-1',
    handCount: 2,
  };

  it('rejects approval until every required attribute is set', async () => {
    const { prisma, wordCreate } = makePrisma();
    const service = new AdminService(prisma, audit, storage, media);
    await expect(
      service.approveSubmission('sub-1', { topicId: 'topic-1' }, 'admin-1'),
    ).rejects.toThrow('Missing required attributes');
    expect(wordCreate).not.toHaveBeenCalled();
  });

  it('creates an approved word carrying all attributes', async () => {
    const { prisma, wordCreate } = makePrisma();
    const service = new AdminService(prisma, audit, storage, media);

    const result = await service.approveSubmission('sub-1', fullDto, 'admin-1');

    expect(result).toEqual({ wordId: 'word-1' });
    expect(wordCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          topicId: 'topic-1',
          ageGroupId: 'age-1',
          levelId: 'level-1',
          handCount: 2,
        }),
      }),
    );
  });
});
