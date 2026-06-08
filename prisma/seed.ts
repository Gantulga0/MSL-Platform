/**
 * Database seed (SPEC §16 step 2 / Appendix A). Idempotent — safe to re-run.
 * Seeds: School #29, the level/age-group/topic taxonomy, one admin user, and the
 * default duplicate-detection threshold setting.
 *
 * Run: `npm run db:seed` (requires DATABASE_URL + applied migrations).
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Fixed id so re-seeding updates the same pilot school (single-school MVP, G-12).
const SCHOOL_29_ID = '00000000-0000-0000-0000-000000000029';

async function seedSchool(): Promise<void> {
  await prisma.school.upsert({
    where: { id: SCHOOL_29_ID },
    update: { name: 'Тусгай хэрэгцээт 29-р сургууль', type: 'special_needs' },
    create: {
      id: SCHOOL_29_ID,
      name: 'Тусгай хэрэгцээт 29-р сургууль',
      type: 'special_needs',
      contact: null,
    },
  });
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

interface TopicSeed {
  slug: string;
  name: string;
  children?: TopicSeed[];
}

// Appendix A topic tree.
const TOPICS: TopicSeed[] = [
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
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@msl.example';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'change_me_admin_password';
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
      schoolId: SCHOOL_29_ID,
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
  await seedSchool();
  await seedLevels();
  await seedAgeGroups();
  await seedTopics();
  await seedAdmin();
  await seedSettings();
  // eslint-disable-next-line no-console
  console.log('[seed] School #29, taxonomy, admin user, and settings are ready.');
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
