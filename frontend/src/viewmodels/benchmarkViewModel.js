const SCORE_PRIORITY = ['multi_core', 'single_core', 'graphics_score', 'combined_score', 'seq_read', 'read', 'write'];

const CATEGORY_ACCENTS = {
  cpu: 'from-sky-300 to-sky-500',
  gpu: 'from-emerald-300 to-emerald-500',
  ram: 'from-indigo-300 to-violet-500',
  storage: 'from-amber-300 to-orange-500'
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatMetricLabel(metricKey = '') {
  return metricKey
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getScoreEntries(scores = {}) {
  return Object.entries(scores)
    .map(([key, value]) => ({ key, value: toNumber(value) }))
    .filter((entry) => entry.value !== null)
    .sort((a, b) => b.value - a.value);
}

export function getMainScore(benchmark) {
  const entries = getScoreEntries(benchmark?.scores || {});
  if (!entries.length) {
    return null;
  }

  for (const key of SCORE_PRIORITY) {
    const found = entries.find((entry) => entry.key === key);
    if (found) {
      return found;
    }
  }

  return entries[0];
}

export function getCategoryTone(category) {
  switch (category) {
    case 'cpu':
      return 'mid';
    case 'gpu':
      return 'high';
    case 'storage':
      return 'low';
    default:
      return 'mid';
  }
}

export function getCategoryAccent(category) {
  return CATEGORY_ACCENTS[category] || 'from-slate-300 to-slate-500';
}

export function formatScore(value) {
  const numeric = toNumber(value);
  if (numeric === null) {
    return '-';
  }

  return numeric.toLocaleString();
}

export function formatBenchmarkDate(value, locale = 'en-US') {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function scoreCompleteness(scores = {}) {
  const valid = getScoreEntries(scores).length;
  return Math.min(40, valid * 10);
}

function recordCompleteness(record = {}) {
  const filled = Object.values(record).filter(Boolean).length;
  return Math.min(30, filled * 6);
}

function detectAnomaly(benchmark) {
  const entries = getScoreEntries(benchmark?.scores || {});
  if (!entries.length) {
    return 8;
  }

  const tooLarge = entries.some((entry) => entry.value > 1500000);
  const negative = entries.some((entry) => entry.value < 0);

  if (negative) {
    return 18;
  }

  if (tooLarge) {
    return 10;
  }

  return 0;
}

export function buildTrustMeta(benchmark) {
  if (!benchmark) {
    return { score: 0, label: 'Low confidence', tone: 'low', reasons: ['No benchmark data available.'] };
  }

  const titleQuality = benchmark.title && benchmark.title.length > 10 ? 10 : 4;
  const scoreQuality = scoreCompleteness(benchmark.scores);
  const hardwareQuality = recordCompleteness(benchmark.hardwareSpecs);
  const softwareQuality = recordCompleteness(benchmark.software);
  const anomalyPenalty = detectAnomaly(benchmark);

  let score = titleQuality + scoreQuality + hardwareQuality + softwareQuality - anomalyPenalty;
  score = Math.max(8, Math.min(99, Math.round(score)));

  let tone = 'mid';
  let label = 'Moderate confidence';

  if (score >= 78) {
    tone = 'high';
    label = 'High confidence';
  } else if (score <= 45) {
    tone = 'low';
    label = 'Needs more details';
  }

  const reasons = [];
  if (scoreQuality < 18) reasons.push('Only a few score metrics were submitted.');
  if (hardwareQuality < 14) reasons.push('Hardware specs are incomplete.');
  if (softwareQuality < 10) reasons.push('Software environment needs more detail.');
  if (anomalyPenalty > 0) reasons.push('Potential outlier values detected.');
  if (!reasons.length) reasons.push('Data depth and consistency look solid.');

  return { score, tone, label, reasons };
}

export function buildScoreBands(benchmarks, metricKey) {
  const scored = benchmarks
    .map((benchmark) => ({
      benchmark,
      score: toNumber(benchmark?.scores?.[metricKey])
    }))
    .filter((entry) => entry.score !== null)
    .sort((a, b) => a.score - b.score);

  if (!scored.length) {
    return {
      metricKey,
      min: 0,
      max: 0,
      median: 0,
      rows: []
    };
  }

  const values = scored.map((entry) => entry.score);
  const min = values[0];
  const max = values[values.length - 1];
  const median = values[Math.floor(values.length / 2)] ?? min;

  const rows = scored.map((entry, index) => {
    const percentile = values.length === 1 ? 100 : Math.round((index / (values.length - 1)) * 100);
    let band = 'Developing';
    if (percentile >= 70) band = 'Top range';
    else if (percentile >= 35) band = 'Mid range';

    return {
      benchmark: entry.benchmark,
      score: entry.score,
      percentile,
      band
    };
  });

  return {
    metricKey,
    min,
    max,
    median,
    rows
  };
}

const ARCHETYPE_RULES = [
  {
    label: 'Enthusiast class',
    match: /rtx\s?50|rtx\s?4090|rx\s?79|i9-14|9950x|7950x3d|threadripper/i
  },
  {
    label: 'High-end gaming',
    match: /rtx\s?4080|rtx\s?4070|rx\s?78|7800x3d|7700x|i7-14|i7-13/i
  },
  {
    label: 'Balanced mainstream',
    match: /rtx\s?4060|rtx\s?3060|rx\s?76|rx\s?66|i5|ryzen\s?5/i
  },
  {
    label: 'Mobile setup',
    match: /notebook|laptop|mobile|hs|u\d{3,4}/i
  }
];

export function buildArchetypeTag(benchmark) {
  const haystack = [
    benchmark?.title,
    ...Object.values(benchmark?.hardwareSpecs || {}),
    ...Object.values(benchmark?.software || {})
  ]
    .filter(Boolean)
    .join(' ');

  for (const rule of ARCHETYPE_RULES) {
    if (rule.match.test(haystack)) {
      return rule.label;
    }
  }

  if (benchmark?.category === 'storage') {
    return 'Storage tuned';
  }

  return 'Community baseline';
}

export function estimateCostTier(benchmark) {
  const archetype = buildArchetypeTag(benchmark);
  if (archetype === 'Enthusiast class') return 2800;
  if (archetype === 'High-end gaming') return 1900;
  if (archetype === 'Balanced mainstream') return 1100;
  if (archetype === 'Mobile setup') return 1400;
  if (archetype === 'Storage tuned') return 700;
  return 1500;
}

export function calculateValueIndex(benchmark) {
  const main = getMainScore(benchmark);
  if (!main) {
    return 0;
  }

  const cost = estimateCostTier(benchmark);
  return Number(((main.value / cost) * 100).toFixed(2));
}

