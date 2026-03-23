const { initializeDatabase, getDb, saveDatabase } = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  console.log('Initializing database...');
  await initializeDatabase();

  console.log('Creating seed users...');
  
  const users = [
    { email: 'admin@pcbenchhub.com', password: 'admin123', username: 'Admin', experienceLevel: 'advanced' },
    { email: 'alex@example.com', password: 'builder123', username: 'AlexBuilder', experienceLevel: 'beginner' },
    { email: 'jordan@example.com', password: 'enthusiast123', username: 'JordanPC', experienceLevel: 'intermediate' },
    { email: 'riley@example.com', password: 'overclock123', username: 'RileyOC', experienceLevel: 'advanced' }
  ];

  const createdUsers = [];
  
  for (const userData of users) {
    try {
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
      createdUsers.push({ id, ...userData });
      console.log(`Created user: ${userData.username}`);
    } catch (error) {
      if (error.message.includes('UNIQUE')) {
        console.log(`User ${userData.username} already exists, skipping...`);
      } else {
        console.error(`Error creating user ${userData.username}:`, error.message);
      }
    }
  }

  console.log('Creating seed benchmarks...');

  const benchmarks = [
    {
      userId: createdUsers[1]?.id || createdUsers[0]?.id,
      title: 'Ryzen 7 7800X3D Gaming Performance',
      category: 'cpu',
      hardwareSpecs: { cpu: 'AMD Ryzen 7 7800X3D', motherboard: 'ASUS ROG Crosshair X670E Hero', ram: '32GB DDR5-6000 CL30', gpu: 'NVIDIA GeForce RTX 4090' },
      software: { os: 'Windows 11 Pro', driver: 'Game Ready 537.58' },
      testTool: 'Cinebench R23',
      scores: { single_core: 1824, multi_core: 18245 }
    },
    {
      userId: createdUsers[1]?.id || createdUsers[0]?.id,
      title: 'RTX 4090 Fire Strike Ultra',
      category: 'gpu',
      hardwareSpecs: { cpu: 'AMD Ryzen 9 7950X', gpu: 'NVIDIA GeForce RTX 4090', ram: '64GB DDR5-6400' },
      software: { os: 'Windows 11 Pro', driver: 'Game Ready 537.58' },
      testTool: '3DMark Fire Strike Ultra',
      scores: { graphics_score: 24567, combined_score: 15234 }
    },
    {
      userId: createdUsers[1]?.id || createdUsers[0]?.id,
      title: 'Budget Build - i5-12400F Baseline',
      category: 'cpu',
      hardwareSpecs: { cpu: 'Intel Core i5-12400F', motherboard: 'MSI MAG B660 Tomahawk', ram: '16GB DDR4-3200', gpu: 'NVIDIA GeForce RTX 3060' },
      software: { os: 'Windows 11 Home', driver: 'Game Ready 536.99' },
      testTool: 'Cinebench R23',
      scores: { single_core: 1623, multi_core: 12345 }
    },
    {
      userId: createdUsers[2]?.id || createdUsers[0]?.id,
      title: 'RTX 4090 @ 3GHz Core Clock',
      category: 'gpu',
      hardwareSpecs: { cpu: 'Intel Core i9-14900K', gpu: 'NVIDIA GeForce RTX 4090 (Water Cooled)', ram: '32GB DDR5-7200' },
      software: { os: 'Windows 11 Pro', driver: 'Game Ready 551.23' },
      testTool: '3DMark Time Spy Extreme',
      scores: { graphics_score: 24580, cpu_score: 12850 }
    },
    {
      userId: createdUsers[1]?.id || createdUsers[0]?.id,
      title: 'Samsung 990 Pro 2TB',
      category: 'storage',
      hardwareSpecs: { storage: 'Samsung 990 Pro 2TB', motherboard: 'ASUS ROG Strix X670E-E' },
      software: { os: 'Windows 11 Pro', nvme_driver: 'Samsung NVMe 4.0' },
      testTool: 'CrystalDiskMark',
      scores: { seq_read: 7124, seq_write: 6942, "4k_read": 105, "4k_write": 140 }
    },
    {
      userId: createdUsers[2]?.id || createdUsers[0]?.id,
      title: 'DDR5-8000 CL36 Memory Kit',
      category: 'ram',
      hardwareSpecs: { ram: 'G.Skill Trident Z5 RGB 32GB DDR5-8000', motherboard: 'ASUS ROG Maximus Z790 Apex' },
      software: { os: 'Windows 11 Pro', memory_controller: 'XMP 3.0' },
      testTool: 'AIDA64',
      scores: { read: 125450, write: 112340, copy: 108900, latency: 58 }
    },
    {
      userId: createdUsers[1]?.id || createdUsers[0]?.id,
      title: 'Ryzen 9 7950X Cinebench',
      category: 'cpu',
      hardwareSpecs: { cpu: 'AMD Ryzen 9 7950X', motherboard: 'ASUS ROG Crosshair X670E Hero', ram: '64GB DDR5-6000' },
      software: { os: 'Windows 11 Pro', driver: 'Latest' },
      testTool: 'Cinebench R23',
      scores: { single_core: 2024, multi_core: 38540 }
    },
    {
      userId: createdUsers[2]?.id || createdUsers[0]?.id,
      title: 'WD Black SN850X 1TB',
      category: 'storage',
      hardwareSpecs: { storage: 'WD Black SN850X 1TB', motherboard: 'MSI MPG B650I Edge' },
      software: { os: 'Windows 11 Home' },
      testTool: 'CrystalDiskMark',
      scores: { seq_read: 7300, seq_write: 6300, "4k_read": 98, "4k_write": 135 }
    },
    {
      userId: createdUsers[2]?.id || createdUsers[0]?.id,
      title: 'RTX 4080 Super Time Spy',
      category: 'gpu',
      hardwareSpecs: { cpu: 'AMD Ryzen 7 7800X3D', gpu: 'NVIDIA GeForce RTX 4080 Super', ram: '32GB DDR5-6400' },
      software: { os: 'Windows 11 Pro', driver: 'Game Ready 551.23' },
      testTool: '3DMark Time Spy',
      scores: { graphics_score: 28540, combined_score: 24123 }
    },
    {
      userId: createdUsers[1]?.id || createdUsers[0]?.id,
      title: 'DDR4-3600 Budget Gaming RAM',
      category: 'ram',
      hardwareSpecs: { ram: 'Corsair Vengeance LPX 16GB DDR4-3600', motherboard: 'MSI B550-A Pro' },
      software: { os: 'Windows 11 Pro', xmp: 'Profile 1' },
      testTool: 'AIDA64',
      scores: { read: 52000, write: 48500, copy: 46000, latency: 72 }
    }
  ];

  let createdCount = 0;
  
  for (const bench of benchmarks) {
    try {
      const db = getDb();
      const id = uuidv4();
      const now = new Date().toISOString();
      
      db.run(
        `INSERT INTO benchmarks (id, user_id, title, category, hardware_specs, software, test_tool, scores, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, bench.userId, bench.title, bench.category, JSON.stringify(bench.hardwareSpecs), JSON.stringify(bench.software), bench.testTool, JSON.stringify(bench.scores), now]
      );
      saveDatabase();
      createdCount++;
      console.log(`Created benchmark: ${bench.title}`);
    } catch (error) {
      if (error.message.includes('UNIQUE')) {
        console.log(`Benchmark "${bench.title}" already exists`);
      } else {
        console.error(`Error creating benchmark "${bench.title}":`, error.message);
      }
    }
  }

  console.log(`\n✅ Seed complete! Created ${createdCount} benchmarks.`);
  console.log('\nTest accounts:');
  console.log('  - admin@pcbenchhub.com / admin123 (Admin)');
  console.log('  - alex@example.com / builder123 (Beginner)');
  console.log('  - jordan@example.com / enthusiast123 (Intermediate)');
  console.log('  - riley@example.com / overclock123 (Advanced)');
}

seed();
