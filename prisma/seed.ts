import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

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

async function seedSignLocations(): Promise<void> {
  const locations = [
    { code: 'neutral', label: 'Саармаг орон зай', sortOrder: 1 },
    { code: 'head', label: 'Толгой', sortOrder: 2 },
    { code: 'face', label: 'Нүүр', sortOrder: 3 },
    { code: 'mouth', label: 'Ам', sortOrder: 4 },
    { code: 'eye', label: 'Нүд', sortOrder: 5 },
    { code: 'ear', label: 'Чих', sortOrder: 6 },
    { code: 'neck', label: 'Хүзүү', sortOrder: 7 },
    { code: 'chest', label: 'Цээж', sortOrder: 8 },
    { code: 'shoulder', label: 'Мөр', sortOrder: 9 },
    { code: 'arm', label: 'Шуу', sortOrder: 10 },
    { code: 'hand', label: 'Алга', sortOrder: 11 },
  ];
  for (const loc of locations) {
    await prisma.signLocation.upsert({ where: { code: loc.code }, update: loc, create: loc });
  }
}

async function seedSignMovements(): Promise<void> {
  const movements = [
    { code: 'none', label: 'Хөдөлгөөнгүй', sortOrder: 1 },
    { code: 'straight', label: 'Шулуун', sortOrder: 2 },
    { code: 'circular', label: 'Тойрог', sortOrder: 3 },
    { code: 'up-down', label: 'Дээш доош', sortOrder: 4 },
    { code: 'sideways', label: 'Хажуу тийш', sortOrder: 5 },
    { code: 'forward', label: 'Урагш', sortOrder: 6 },
    { code: 'tap', label: 'Товших', sortOrder: 7 },
    { code: 'wiggle', label: 'Хуруу хөдөлгөх', sortOrder: 8 },
    { code: 'open-close', label: 'Нээх хаах', sortOrder: 9 },
    { code: 'repeated', label: 'Давтагдах', sortOrder: 10 },
  ];
  for (const mov of movements) {
    await prisma.signMovement.upsert({ where: { code: mov.code }, update: mov, create: mov });
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
  await seedSignLocations();
  await seedSignMovements();
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
