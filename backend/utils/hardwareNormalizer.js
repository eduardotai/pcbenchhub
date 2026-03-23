// Patterns to detect hardware category from free-form text
const CATEGORY_PATTERNS = {
  GPU: [/\b(rtx|gtx|rx\s?\d|radeon|geforce|nvidia|amd\s+gpu|arc\s+a)\b/i],
  CPU: [/\b(intel|amd|ryzen|core\s+i\d|xeon|threadripper|epyc)\b/i],
  RAM: [/\b(\d+\s*gb\s*(ddr[45]?|ram)|ddr[45]?[-\s]\d+|corsair|g\.skill|kingston)\b/i],
  Storage: [/\b(ssd|hdd|nvme|m\.2|sata|wd|seagate|samsung\s+\d{3})\b/i],
};

// Brand extraction rules per category
const BRAND_PATTERNS = {
  GPU: [
    { pattern: /\b(nvidia)\b/i, brand: 'NVIDIA' },
    { pattern: /\b(amd|radeon)\b/i, brand: 'AMD' },
    { pattern: /\b(intel|arc)\b/i, brand: 'Intel' },
    { pattern: /\b(asus|rog|strix)\b/i, brand: 'ASUS' },
    { pattern: /\b(msi)\b/i, brand: 'MSI' },
    { pattern: /\b(gigabyte|aorus)\b/i, brand: 'Gigabyte' },
    { pattern: /\b(evga)\b/i, brand: 'EVGA' },
    { pattern: /\b(zotac)\b/i, brand: 'Zotac' },
    { pattern: /\b(sapphire)\b/i, brand: 'Sapphire' },
    { pattern: /\b(powercolor)\b/i, brand: 'PowerColor' },
  ],
  CPU: [
    { pattern: /\b(intel|core\s+i\d|xeon|celeron|pentium)\b/i, brand: 'Intel' },
    { pattern: /\b(amd|ryzen|threadripper|epyc|athlon)\b/i, brand: 'AMD' },
  ],
  RAM: [
    { pattern: /\b(corsair)\b/i, brand: 'Corsair' },
    { pattern: /\b(g\.?skill)\b/i, brand: 'G.Skill' },
    { pattern: /\b(kingston)\b/i, brand: 'Kingston' },
    { pattern: /\b(crucial)\b/i, brand: 'Crucial' },
    { pattern: /\b(samsung)\b/i, brand: 'Samsung' },
    { pattern: /\b(hynix)\b/i, brand: 'SK Hynix' },
    { pattern: /\b(teamgroup|team\s+group)\b/i, brand: 'TeamGroup' },
    { pattern: /\b(patriot)\b/i, brand: 'Patriot' },
  ],
  Storage: [
    { pattern: /\b(samsung)\b/i, brand: 'Samsung' },
    { pattern: /\b(wd|western\s+digital)\b/i, brand: 'WD' },
    { pattern: /\b(seagate)\b/i, brand: 'Seagate' },
    { pattern: /\b(crucial)\b/i, brand: 'Crucial' },
    { pattern: /\b(kingston)\b/i, brand: 'Kingston' },
    { pattern: /\b(sandisk)\b/i, brand: 'SanDisk' },
    { pattern: /\b(toshiba)\b/i, brand: 'Toshiba' },
    { pattern: /\b(intel)\b/i, brand: 'Intel' },
  ],
};

// Generation patterns per category
const GENERATION_PATTERNS = {
  GPU: [
    { pattern: /\brtx\s*40\d{2}\b/i, generation: 'RTX 40 series' },
    { pattern: /\brtx\s*30\d{2}\b/i, generation: 'RTX 30 series' },
    { pattern: /\brtx\s*20\d{2}\b/i, generation: 'RTX 20 series' },
    { pattern: /\bgtx\s*16\d{2}\b/i, generation: 'GTX 16 series' },
    { pattern: /\bgtx\s*10\d{2}\b/i, generation: 'GTX 10 series' },
    { pattern: /\brx\s*7[0-9]{3}\b/i, generation: 'RX 7000 series' },
    { pattern: /\brx\s*6[0-9]{3}\b/i, generation: 'RX 6000 series' },
    { pattern: /\brx\s*5[0-9]{3}\b/i, generation: 'RX 5000 series' },
    { pattern: /\barc\s*a[0-9]{3}\b/i, generation: 'Arc A series' },
  ],
  CPU: [
    { pattern: /\bryzen\s*[79]\s*7[0-9]{3}\b/i, generation: 'Ryzen 7000 series' },
    { pattern: /\bryzen\s*[579]\s*5[0-9]{3}\b/i, generation: 'Ryzen 5000 series' },
    { pattern: /\bryzen\s*[579]\s*3[0-9]{3}\b/i, generation: 'Ryzen 3000 series' },
    { pattern: /\bcore\s*i[0-9]\s*1[3-4][0-9]{3}\b/i, generation: '13th/14th Gen Intel' },
    { pattern: /\bcore\s*i[0-9]\s*1[12][0-9]{3}\b/i, generation: '11th/12th Gen Intel' },
    { pattern: /\bcore\s*i[0-9]\s*[0-9]{4}\b/i, generation: 'Intel Core' },
  ],
  RAM: [
    { pattern: /\bddr5\b/i, generation: 'DDR5' },
    { pattern: /\bddr4\b/i, generation: 'DDR4' },
    { pattern: /\bddr3\b/i, generation: 'DDR3' },
  ],
  Storage: [
    { pattern: /\bnvme\b/i, generation: 'NVMe' },
    { pattern: /\bm\.?2\b/i, generation: 'M.2' },
    { pattern: /\bsata\s*(iii|3)\b/i, generation: 'SATA III' },
    { pattern: /\bsata\b/i, generation: 'SATA' },
  ],
};

/**
 * Normalizes raw text: lowercase, remove special characters, collapse whitespace.
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects the hardware category from free-form text.
 * Returns one of: 'GPU', 'CPU', 'RAM', 'Storage', or 'Other'.
 */
function detectCategory(text) {
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return category;
      }
    }
  }
  return 'Other';
}

/**
 * Extracts the primary brand from text given a detected category.
 * Returns null if no brand is found.
 */
function extractBrand(text, category) {
  const brandList = BRAND_PATTERNS[category];
  if (!brandList) return null;
  for (const { pattern, brand } of brandList) {
    if (pattern.test(text)) {
      return brand;
    }
  }
  return null;
}

/**
 * Extracts the hardware generation from text given a detected category.
 * Returns null if no generation is found.
 */
function extractGeneration(text, category) {
  const genList = GENERATION_PATTERNS[category];
  if (!genList) return null;
  for (const { pattern, generation } of genList) {
    if (pattern.test(text)) {
      return generation;
    }
  }
  return null;
}

/**
 * Parses free-form hardware text into a structured object.
 * Returns { name, normalized_name, category, brand, generation }.
 */
function parseHardwareName(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return null;
  }

  const trimmed = rawText.trim();
  const normalized = normalizeText(trimmed);
  const category = detectCategory(trimmed);
  const brand = extractBrand(trimmed, category);
  const generation = extractGeneration(trimmed, category);

  // Canonical name: original text with normalized whitespace
  const name = trimmed.replace(/\s+/g, ' ');

  return {
    name,
    normalized_name: normalized,
    category,
    brand,
    generation,
  };
}

module.exports = { parseHardwareName, normalizeText, detectCategory, extractBrand };
