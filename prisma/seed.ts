import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Option images live in the SAME storage as videos (apps/api/storage), under
// options/<kind>/. The API serves them at /api/v1/options/images/<kind>/<file>.
const API_DIR = resolve(__dirname, '..', 'apps', 'api');
const STORAGE_DIR = resolve(API_DIR, process.env.STORAGE_LOCAL_DIR ?? './storage');
const SEED_IMAGES_DIR = resolve(API_DIR, 'seed', 'option-images');
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'svg'] as const;

/** Minimal labelled SVG placeholder used when no real artwork is supplied. */
function placeholderSvg(label: string, kind: string): Buffer {
  const hue = [...kind].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect width="160" height="160" rx="16" fill="hsl(${hue} 50% 90%)"/>
  <text x="80" y="86" font-family="sans-serif" font-size="16" fill="hsl(${hue} 40% 30%)" text-anchor="middle">${label}</text>
</svg>`;
  return Buffer.from(svg, 'utf8');
}

/**
 * Copy a known option image into storage (or generate a placeholder), returning
 * the public imageUrl. Real artwork dropped at
 * apps/api/seed/option-images/<kind>/<code>.<ext> takes precedence.
 */
function materializeOptionImage(kind: string, code: string, label: string): string {
  let ext = 'svg';
  let bytes: Buffer | null = null;
  for (const e of IMAGE_EXTS) {
    const src = resolve(SEED_IMAGES_DIR, kind, `${code}.${e}`);
    if (existsSync(src)) {
      ext = e;
      bytes = readFileSync(src);
      break;
    }
  }
  if (!bytes) bytes = placeholderSvg(label, kind);

  const destDir = resolve(STORAGE_DIR, 'options', kind);
  mkdirSync(destDir, { recursive: true });
  writeFileSync(resolve(destDir, `${code}.${ext}`), bytes);
  return `/api/v1/options/images/${kind}/${code}.${ext}`;
}

async function seedLevels(): Promise<void> {
  const levels = [
    { code: 'beginner', label: 'Анхан', sortOrder: 1 },
    { code: 'elementary', label: 'Бага', sortOrder: 2 },
    { code: 'intermediate', label: 'Дунд', sortOrder: 3 },
    { code: 'advanced', label: 'Ахисан', sortOrder: 4 },
  ];
  for (const lvl of levels) {
    await prisma.level.upsert({ where: { code: lvl.code }, update: lvl, create: lvl });
  }
}

async function seedAgeGroups(): Promise<void> {
  const groups = [
    { code: 'under7', label: '7-аас доош', minAge: null, maxAge: 6 },
    { code: '7-10', label: '7-10 нас', minAge: 7, maxAge: 10 },
    { code: '11-14', label: '11-14 нас', minAge: 11, maxAge: 14 },
    { code: '15plus', label: '15+ нас', minAge: 15, maxAge: null },
  ];
  for (const g of groups) {
    await prisma.ageGroup.upsert({ where: { code: g.code }, update: g, create: g });
  }
}

async function seedHandedness(): Promise<void> {
  const items = [
    { code: 'one', label: 'Нэг гар', handCount: 1, sortOrder: 1 },
    { code: 'two', label: 'Хоёр гар', handCount: 2, sortOrder: 2 },
  ];
  for (const h of items) {
    const data = { ...h, imageUrl: materializeOptionImage('handedness', h.code, h.label) };
    await prisma.handedness.upsert({ where: { code: h.code }, update: data, create: data });
  }
}

interface TopicSeed {
  slug: string;
  name: string;
  children?: TopicSeed[];
}

const TOPICS: TopicSeed[] = [
  {
    slug: 'conversational',
    name: 'Харилцан ярианд өргөн хэрэглэгддэг дохио',
    children: [
      { slug: 'common-signs', name: 'Түгээмэл хэрэглэгдэх дохио' },
      { slug: 'action-signs', name: 'Үйлдлийг илэрхийлсэн дохио' },
      { slug: 'quality-signs', name: 'Шинж, чанар байдлыг илэрхийлсэн дохио' },
      { slug: 'question-signs', name: 'Асуултыг илэрхийлсэн дохио' },
      { slug: 'negation-signs', name: 'Үгүйсгэх үйлдлийг илэрхийлсэн дохио' },
    ],
  },
  {
    slug: 'daily',
    name: 'Өдөр тутам',
    children: [
      { slug: 'greetings', name: 'Мэндчилгээ' },
      { slug: 'family', name: 'Гэр бүл' },
      { slug: 'food', name: 'Хоол хүнс' },
      { slug: 'time', name: 'Цаг хугацаа' },
      { slug: 'emotions', name: 'Сэтгэл хөдлөл' },
    ],
  },
  {
    slug: 'school',
    name: 'Сургууль',
    children: [
      { slug: 'classroom', name: 'Анги танхим' },
      { slug: 'subjects', name: 'Хичээлүүд' },
      { slug: 'stationery', name: 'Бичгийн хэрэгсэл' },
    ],
  },
  {
    slug: 'science',
    name: 'Шинжлэх ухаан',
    children: [
      { slug: 'chemistry', name: 'Хими' },
      { slug: 'physics', name: 'Физик' },
      { slug: 'biology', name: 'Биологи' },
      { slug: 'math', name: 'Математик' },
      { slug: 'ai-tech', name: 'Хиймэл оюун / Технологи' },
    ],
  },
  {
    slug: 'nature',
    name: 'Байгаль',
    children: [
      { slug: 'animals', name: 'Амьтад' },
      { slug: 'weather', name: 'Цаг агаар' },
      { slug: 'plants', name: 'Ургамал' },
    ],
  },
  { slug: 'numbers', name: 'Тоо ба хурууны үсэг' },
];

async function seedTopics(): Promise<void> {
  let order = 0;
  for (const top of TOPICS) {
    order += 1;
    const parent = await prisma.topic.upsert({
      where: { slug: top.slug },
      update: { name: top.name, sortOrder: order, parentId: null },
      create: { slug: top.slug, name: top.name, sortOrder: order },
    });
    let childOrder = 0;
    for (const child of top.children ?? []) {
      childOrder += 1;
      await prisma.topic.upsert({
        where: { slug: child.slug },
        update: { name: child.name, sortOrder: childOrder, parentId: parent.id },
        create: { slug: child.slug, name: child.name, sortOrder: childOrder, parentId: parent.id },
      });
    }
  }
}

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@gmail.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await argon2.hash(password);
  await prisma.user.upsert({
    where: { email },
    update: { role: 'admin', status: 'active' },
    create: {
      email,
      passwordHash,
      role: 'admin',
      displayName: 'Систем админ',
      isMinor: false,
      emailVerifiedAt: new Date(),
      locale: 'mn',
    },
  });
}

async function seedSettings(): Promise<void> {
  const threshold = Number(process.env.DUPLICATE_TRIGRAM_THRESHOLD ?? '0.45');
  await prisma.setting.upsert({
    where: { key: 'duplicate_trigram_threshold' },
    update: { value: threshold },
    create: { key: 'duplicate_trigram_threshold', value: threshold },
  });
}

async function main(): Promise<void> {
  await seedLevels();
  await seedAgeGroups();
  await seedHandedness();
  await seedTopics();
  await seedAdmin();
  await seedSettings();
  // eslint-disable-next-line no-console
  console.log('[seed] Taxonomy, admin user, and settings are ready.');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
