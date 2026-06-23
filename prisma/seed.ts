import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const API_DIR = resolve(__dirname, '..', 'apps', 'api');
const STORAGE_DIR = resolve(API_DIR, process.env.STORAGE_LOCAL_DIR ?? './storage');
const SEED_IMAGES_DIR = resolve(API_DIR, 'seed', 'option-images');
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'svg'] as const;

const STORAGE_DRIVER = (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();
const R2_PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '') || null;
const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

let r2Client: S3Client | null = null;
function r2(): S3Client {
  if (r2Client) return r2Client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey || !process.env.R2_BUCKET) {
    throw new Error(
      'STORAGE_DRIVER=r2 requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET',
    );
  }
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return r2Client;
}

function placeholderSvg(label: string, kind: string): Buffer {
  const hue = [...kind].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect width="160" height="160" rx="16" fill="hsl(${hue} 50% 90%)"/>
  <text x="80" y="86" font-family="sans-serif" font-size="16" fill="hsl(${hue} 40% 30%)" text-anchor="middle">${label}</text>
</svg>`;
  return Buffer.from(svg, 'utf8');
}

async function materializeOptionImage(kind: string, code: string, label: string): Promise<string> {
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

  const key = `options/${kind}/${code}.${ext}`;
  const apiUrl = `/api/v1/options/images/${kind}/${code}.${ext}`;

  if (STORAGE_DRIVER === 'r2') {
    await r2().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        Body: bytes,
        ContentType: MIME_BY_EXT[ext] ?? 'application/octet-stream',
      }),
    );
    return R2_PUBLIC_BASE ? `${R2_PUBLIC_BASE}/${key}` : apiUrl;
  }

  const destDir = resolve(STORAGE_DIR, 'options', kind);
  mkdirSync(destDir, { recursive: true });
  writeFileSync(resolve(destDir, `${code}.${ext}`), bytes);
  return apiUrl;
}

async function seedLevels(): Promise<void> {
  const levels = [
    { code: 'beginner', label: 'Анхан', sortOrder: 1 },
    { code: 'intermediate', label: 'Дунд', sortOrder: 3 },
    { code: 'advanced', label: 'Ахисан', sortOrder: 4 },
  ];
  for (const lvl of levels) {
    await prisma.level.upsert({ where: { code: lvl.code }, update: lvl, create: lvl });
  }
  const codes = levels.map((l) => l.code);
  const stale = await prisma.level.findMany({
    where: { code: { notIn: codes } },
    select: { id: true },
  });
  if (stale.length) {
    const ids = stale.map((s) => s.id);
    await prisma.word.updateMany({ where: { levelId: { in: ids } }, data: { levelId: null } });
    await prisma.level.deleteMany({ where: { id: { in: ids } } });
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
    const data = { ...h, imageUrl: await materializeOptionImage('handedness', h.code, h.label) };
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
    slug: 'greeting',
    name: 'Мэндчилгээ ба хүн',
    children: [
      { slug: 'greetings', name: 'Мэндчилгээ, баяр ёслол' },
      { slug: 'family', name: 'Гэр бүл' },
      { slug: 'person', name: 'Хүн' },
    ],
  },
  {
    slug: 'education',
    name: 'Боловсрол',
    children: [
      { slug: 'school', name: 'Сургууль' },
      { slug: 'school-supplies', name: 'Хичээлийн хэрэгсэл' },
      { slug: 'education-signs', name: 'Боловсролтой холбоотой дохио' },
    ],
  },
  {
    slug: 'employment',
    name: 'Хөдөлмөр эрхлэлт',
    children: [
      { slug: 'profession', name: 'Ажил, мэргэжил' },
      { slug: 'workplace', name: 'Ажилтай холбоотой үгс' },
      { slug: 'business-work', name: 'Бизнес, хөдөлмөр эрхлэлттэй холбоотой дохио' },
    ],
  },
  {
    slug: 'health',
    name: 'Эрүүл мэнд',
    children: [
      { slug: 'body-parts', name: 'Бие эрхтэн' },
      { slug: 'health-signs', name: 'Эмчилгээ, эрүүл мэндтэй холбоотой дохио' },
    ],
  },
  {
    slug: 'emotions',
    name: 'Сэтгэл хөдлөл',
  },
  {
    slug: 'living-environment',
    name: 'Амьдрах орчин',
    children: [
      { slug: 'home-items', name: 'Гэр орон, гэрийн эд зүйлс' },
      { slug: 'furniture', name: 'Гэрийн тавилга' },
      { slug: 'kitchenware', name: 'Гал тогооны хэрэгсэл' },
      { slug: 'appliances', name: 'Цахилгаан хэрэгсэл' },
      { slug: 'hygiene-items', name: 'Ариун цэврийн хэрэгсэл' },
    ],
  },
  {
    slug: 'clothing',
    name: 'Хувцас хэрэглэл',
    children: [
      { slug: 'clothes', name: 'Хувцас' },
      { slug: 'accessories', name: 'Эдлэл хэрэгсэл' },
      { slug: 'cosmetics', name: 'Гоо сайхны бараа' },
    ],
  },
  {
    slug: 'food',
    name: 'Хоол хүнсний бүтээгдэхүүн',
    children: [
      { slug: 'vegetables', name: 'Хүнсний ногоо' },
      { slug: 'fruits', name: 'Жимс, жимсгэнэ' },
      { slug: 'dairy', name: 'Сүү, сүүн бүтээгдэхүүн' },
      { slug: 'sweets', name: 'Амттан' },
      { slug: 'drinks', name: 'Уух зүйлс' },
      { slug: 'meat', name: 'Мах, махан бүтээгдэхүүн' },
      { slug: 'grains', name: 'Үр тарианы бүтээгдэхүүн' },
      { slug: 'meals-snacks', name: 'Хоол зууш' },
      { slug: 'food-signs', name: 'Хүнсний бүтээгдэхүүн, хоол хүнстэй холбоотой дохио' },
    ],
  },
  {
    slug: 'color-shape-size',
    name: 'Өнгө ба хэлбэр дүрс, хэмжээ',
    children: [
      { slug: 'colors', name: 'Өнгө' },
      { slug: 'shapes', name: 'Хэлбэр дүрс' },
      { slug: 'size-units', name: 'Хэмжээ ба хэмжих нэгж' },
    ],
  },
  {
    slug: 'animals',
    name: 'Ан амьтан',
    children: [
      { slug: 'wild-animals', name: 'Ан амьтан' },
      { slug: 'livestock', name: 'Таван хошуу мал' },
      { slug: 'birds', name: 'Жигүүртэн шувуу' },
      { slug: 'aquatic-animals', name: 'Усны амьтан' },
      { slug: 'insects', name: 'Хорхой шавж' },
    ],
  },
  {
    slug: 'nature',
    name: 'Байгаль',
    children: [
      { slug: 'nature-general', name: 'Байгаль' },
      { slug: 'natural-phenomena', name: 'Байгалийн үзэгдэл' },
    ],
  },
  {
    slug: 'time-space',
    name: 'Цаг хугацаа, орон зай',
    children: [
      { slug: 'time', name: 'Цаг хугацаа' },
      { slug: 'space', name: 'Орон зай' },
      { slug: 'seasons', name: 'Улирал' },
    ],
  },
  {
    slug: 'technology',
    name: 'Техник технологи',
    children: [
      { slug: 'equipment', name: 'Тоног төхөөрөмж' },
      { slug: 'social-media', name: 'Нийгмийн сүлжээ' },
      { slug: 'technology-signs', name: 'Техник технологитой холбоотой дохио' },
    ],
  },
  {
    slug: 'sport',
    name: 'Спорт',
    children: [
      { slug: 'sport-types', name: 'Спортын төрөл' },
      { slug: 'sport-equipment', name: 'Спортын хэрэгсэл' },
      { slug: 'sport-signs', name: 'Спорттой холбоотой дохио' },
    ],
  },
  {
    slug: 'games',
    name: 'Тоглоом',
  },
  {
    slug: 'art',
    name: 'Урлаг, урлал',
    children: [
      { slug: 'art-culture', name: 'Урлаг соёл' },
      { slug: 'handicraft', name: 'Гар урлал, уран бүтээл' },
      { slug: 'music', name: 'Хөгжим, хөгжмийн зэвсэг' },
    ],
  },
  {
    slug: 'transport',
    name: 'Тээврийн хэрэгсэл',
    children: [
      { slug: 'vehicles', name: 'Тээврийн хэрэгсэл' },
      { slug: 'traffic-signs', name: 'Зам тээвэртэй холбоотой дохио' },
    ],
  },
  {
    slug: 'social-environment',
    name: 'Нийгмийн орчин',
    children: [
      { slug: 'politics-law', name: 'Улс төр, хууль эрх зүй, нийгэм' },
      { slug: 'religion', name: 'Шашин шүтлэг' },
      { slug: 'organizations', name: 'Аж ахуйн нэгж, байгууллага' },
      { slug: 'documents', name: 'Дүрэм журам, баримт бичиг' },
    ],
  },
  {
    slug: 'place-names',
    name: 'Газрын нэр',
    children: [
      { slug: 'countries', name: 'Улс орон' },
      { slug: 'cities', name: 'Хотууд' },
      { slug: 'provinces-districts', name: 'Аймаг, дүүрэг, сум' },
      { slug: 'location-signs', name: 'Байршил, газрын нэрийг илэрхийлсэн дохио' },
    ],
  },
  {
    slug: 'science',
    name: 'Шинжлэх ухаан',
    children: [
      { slug: 'math', name: 'Математик' },
      { slug: 'physics', name: 'Физик' },
      { slug: 'chemistry', name: 'Хими' },
      { slug: 'biology', name: 'Биологи' },
      { slug: 'artificial-intelligence', name: 'Хиймэл оюун ухаан' },
    ],
  },
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
