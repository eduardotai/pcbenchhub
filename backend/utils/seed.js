const { initializeDatabase, getDb, saveDatabase } = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const Benchmark = require('../models/Benchmark');
const Badge = require('../models/Badge');
const ReportTag = require('../models/ReportTag');
const HardwareComponent = require('../models/HardwareComponent');
const { recalculateRating } = require('./ratingEngine');

const SEED_USERS = [
  { email: 'admin@pcbenchhub.com', password: 'admin123', username: 'Admin', experienceLevel: 'advanced' },
  { email: 'alex@example.com', password: 'builder123', username: 'AlexBuilder', experienceLevel: 'beginner' },
  { email: 'jordan@example.com', password: 'enthusiast123', username: 'JordanPC', experienceLevel: 'intermediate' },
  { email: 'riley@example.com', password: 'overclock123', username: 'RileyOC', experienceLevel: 'advanced' },
];

const SEED_TAGS = [
  { name: 'overclocked', category: 'tuning' },
  { name: 'stable', category: 'quality' },
  { name: 'gaming', category: 'scenario' },
  { name: 'productivity', category: 'scenario' },
  { name: 'value', category: 'build-type' },
  { name: 'high-end', category: 'build-type' },
  { name: 'silent', category: 'build-type' },
  { name: 'thermals', category: 'quality' },
];

const SEED_BENCHMARKS = [
  {
    userRef: 'alex@example.com',
    title: 'Ryzen 7 7800X3D Gaming Performance',
    category: 'cpu',
    hardwareSpecs: {
      cpu: 'AMD Ryzen 7 7800X3D',
      motherboard: 'ASUS ROG Crosshair X670E Hero',
      ram: '32GB DDR5-6000 CL30',
      gpu: 'NVIDIA GeForce RTX 4090',
    },
    software: { os: 'Windows 11 Pro', driver: 'Game Ready 537.58' },
    testTool: 'Cinebench R23',
    scores: { single_core: 1824, multi_core: 18245 },
    tags: ['gaming', 'high-end'],
  },
  {
    userRef: 'alex@example.com',
    title: 'RTX 4090 Fire Strike Ultra',
    category: 'gpu',
    hardwareSpecs: {
      cpu: 'AMD Ryzen 9 7950X',
      gpu: 'NVIDIA GeForce RTX 4090',
      ram: '64GB DDR5-6400',
    },
    software: { os: 'Windows 11 Pro', driver: 'Game Ready 537.58' },
    testTool: '3DMark Fire Strike Ultra',
    scores: { graphics_score: 24567, combined_score: 15234 },
    tags: ['gaming', 'high-end'],
  },
  {
    userRef: 'alex@example.com',
    title: 'Budget Build - i5-12400F Baseline',
    category: 'cpu',
    hardwareSpecs: {
      cpu: 'Intel Core i5-12400F',
      motherboard: 'MSI MAG B660 Tomahawk',
      ram: '16GB DDR4-3200',
      gpu: 'NVIDIA GeForce RTX 3060',
    },
    software: { os: 'Windows 11 Home', driver: 'Game Ready 536.99' },
    testTool: 'Cinebench R23',
    scores: { single_core: 1623, multi_core: 12345 },
    tags: ['value', 'gaming'],
  },
  {
    userRef: 'jordan@example.com',
    title: 'RTX 4090 @ 3GHz Core Clock',
    category: 'gpu',
    hardwareSpecs: {
      cpu: 'Intel Core i9-14900K',
      gpu: 'NVIDIA GeForce RTX 4090 (Water Cooled)',
      ram: '32GB DDR5-7200',
    },
    software: { os: 'Windows 11 Pro', driver: 'Game Ready 551.23' },
    testTool: '3DMark Time Spy Extreme',
    scores: { graphics_score: 24580, cpu_score: 12850 },
    tags: ['overclocked', 'gaming'],
    user_notes: 'Liquid cooled, tuned fan curve and voltage offset.',
  },
  {
    userRef: 'alex@example.com',
    title: 'Samsung 990 Pro 2TB',
    category: 'storage',
    hardwareSpecs: {
      storage: 'Samsung 990 Pro 2TB',
      motherboard: 'ASUS ROG Strix X670E-E',
    },
    software: { os: 'Windows 11 Pro', nvme_driver: 'Samsung NVMe 4.0' },
    testTool: 'CrystalDiskMark',
    scores: { seq_read: 7124, seq_write: 6942, '4k_read': 105, '4k_write': 140 },
    tags: ['stable', 'high-end'],
  },
  {
    userRef: 'jordan@example.com',
    title: 'DDR5-8000 CL36 Memory Kit',
    category: 'ram',
    hardwareSpecs: {
      ram: 'G.Skill Trident Z5 RGB 32GB DDR5-8000',
      motherboard: 'ASUS ROG Maximus Z790 Apex',
    },
    software: { os: 'Windows 11 Pro', memory_controller: 'XMP 3.0' },
    testTool: 'AIDA64',
    scores: { read: 125450, write: 112340, copy: 108900, latency: 58 },
    tags: ['overclocked', 'high-end'],
  },
  {
    userRef: 'alex@example.com',
    title: 'Ryzen 9 7950X Cinebench',
    category: 'cpu',
    hardwareSpecs: {
      cpu: 'AMD Ryzen 9 7950X',
      motherboard: 'ASUS ROG Crosshair X670E Hero',
      ram: '64GB DDR5-6000',
    },
    software: { os: 'Windows 11 Pro', driver: 'Latest' },
    testTool: 'Cinebench R23',
    scores: { single_core: 2024, multi_core: 38540 },
    tags: ['productivity', 'high-end'],
  },
  {
    userRef: 'jordan@example.com',
    title: 'WD Black SN850X 1TB',
    category: 'storage',
    hardwareSpecs: {
      storage: 'WD Black SN850X 1TB',
      motherboard: 'MSI MPG B650I Edge',
    },
    software: { os: 'Windows 11 Home' },
    testTool: 'CrystalDiskMark',
    scores: { seq_read: 7300, seq_write: 6300, '4k_read': 98, '4k_write': 135 },
    tags: ['gaming', 'stable'],
  },
  {
    userRef: 'jordan@example.com',
    title: 'RTX 4080 Super Time Spy',
    category: 'gpu',
    hardwareSpecs: {
      cpu: 'AMD Ryzen 7 7800X3D',
      gpu: 'NVIDIA GeForce RTX 4080 Super',
      ram: '32GB DDR5-6400',
    },
    software: { os: 'Windows 11 Pro', driver: 'Game Ready 551.23' },
    testTool: '3DMark Time Spy',
    scores: { graphics_score: 28540, combined_score: 24123 },
    tags: ['gaming', 'stable'],
  },
  {
    userRef: 'alex@example.com',
    title: 'DDR4-3600 Budget Gaming RAM',
    category: 'ram',
    hardwareSpecs: {
      ram: 'Corsair Vengeance LPX 16GB DDR4-3600',
      motherboard: 'MSI B550-A Pro',
    },
    software: { os: 'Windows 11 Pro', xmp: 'Profile 1' },
    testTool: 'AIDA64',
    scores: { read: 52000, write: 48500, copy: 46000, latency: 72 },
    tags: ['value', 'gaming'],
  },
];

function getExistingUserByEmail(email) {
  const db = getDb();
  const stmt = db.prepare('SELECT id, email, username, experience_level FROM users WHERE email = ?');
  stmt.bind([email.toLowerCase()]);

  let user = null;
  if (stmt.step()) {
    user = stmt.getAsObject();
  }
  stmt.free();

  return user;
}

function ensureUser(userData) {
  const existing = getExistingUserByEmail(userData.email);
  if (existing) {
    return existing;
  }

  const db = getDb();
  const id = uuidv4();
  const hashedPassword = bcrypt.hashSync(userData.password, 10);
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO users (id, email, password, username, experience_level, is_verified, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, userData.email.toLowerCase(), hashedPassword, userData.username, userData.experienceLevel, now, now]
  );
  saveDatabase();

  return { id, email: userData.email.toLowerCase(), username: userData.username, experience_level: userData.experienceLevel };
}

function benchmarkExists(title) {
  const db = getDb();
  const stmt = db.prepare('SELECT id FROM benchmarks WHERE title = ? LIMIT 1');
  stmt.bind([title]);

  let exists = false;
  if (stmt.step()) {
    exists = true;
  }
  stmt.free();

  return exists;
}

function resolveComponentIds(hardwareSpecs = {}) {
  const ids = new Set();

  for (const rawValue of Object.values(hardwareSpecs)) {
    if (!rawValue || typeof rawValue !== 'string') continue;

    try {
      const { component } = HardwareComponent.findOrCreate(rawValue);
      if (component?.id != null) {
        ids.add(component.id);
      }
    } catch (err) {
      console.error('[seed] failed to resolve hardware component:', rawValue, err.message);
    }
  }

  return [...ids];
}

function seedTags() {
  for (const tag of SEED_TAGS) {
    ReportTag.findOrCreate(tag.name, tag.category);
  }
}

function refreshHardwareRatings(componentIds) {
  for (const componentId of componentIds) {
    try {
      HardwareComponent.updateStats(componentId);
      recalculateRating(componentId);
    } catch (err) {
      console.error(`[seed] failed to refresh component ${componentId}:`, err.message);
    }
  }
}

async function seed() {
  console.log('Initializing database...');
  await initializeDatabase();

  console.log('Seeding badges and base tags...');
  Badge.seed();
  seedTags();

  console.log('Seeding users...');
  const userByEmail = new Map();
  for (const userData of SEED_USERS) {
    const user = ensureUser(userData);
    userByEmail.set(user.email, user);
    console.log(`User ready: ${user.username}`);
  }

  console.log('Seeding benchmarks and hardware links...');
  const touchedComponentIds = new Set();
  let createdBenchmarks = 0;

  for (const seedBenchmark of SEED_BENCHMARKS) {
    if (benchmarkExists(seedBenchmark.title)) {
      console.log(`Benchmark already exists, skipping: ${seedBenchmark.title}`);
      continue;
    }

    const user = userByEmail.get(seedBenchmark.userRef.toLowerCase()) || userByEmail.get('admin@pcbenchhub.com');
    const componentIds = resolveComponentIds(seedBenchmark.hardwareSpecs);
    componentIds.forEach((id) => touchedComponentIds.add(id));

    const benchmark = Benchmark.create({
      userId: user.id,
      title: seedBenchmark.title,
      category: seedBenchmark.category,
      hardwareSpecs: seedBenchmark.hardwareSpecs,
      software: seedBenchmark.software,
      testTool: seedBenchmark.testTool,
      scores: seedBenchmark.scores,
      component_ids: componentIds,
      report_type: seedBenchmark.report_type || 'benchmark',
      gaming_context: seedBenchmark.gaming_context,
      user_notes: seedBenchmark.user_notes,
      tags: seedBenchmark.tags,
    });

    if (Array.isArray(seedBenchmark.tags)) {
      for (const tagName of seedBenchmark.tags) {
        const tag = ReportTag.findOrCreate(tagName);
        if (tag) {
          ReportTag.addToReport(benchmark.id, tag.id);
        }
      }
    }

    createdBenchmarks += 1;
    console.log(`Created benchmark: ${seedBenchmark.title}`);
  }

  if (touchedComponentIds.size > 0) {
    console.log('Refreshing hardware stats and ratings...');
    refreshHardwareRatings([...touchedComponentIds]);
  }

  console.log(`\nSeed complete. Created ${createdBenchmarks} new benchmarks.`);
  console.log('\nTest accounts:');
  console.log('  - admin@pcbenchhub.com / admin123 (Admin)');
  console.log('  - alex@example.com / builder123 (Beginner)');
  console.log('  - jordan@example.com / enthusiast123 (Intermediate)');
  console.log('  - riley@example.com / overclock123 (Advanced)');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exitCode = 1;
});
