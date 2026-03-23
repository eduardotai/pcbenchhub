import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

/**
 * ScoreDistribution — histogram of benchmark scores for a hardware component.
 *
 * Props:
 *   scores  {number[]}  — array of raw numeric scores
 */
export default function ScoreDistribution({ scores = [] }) {
  if (!scores.length) {
    return (
      <div
        className="surface"
        style={{ padding: '1.5rem', borderRadius: 'var(--r-lg)', textAlign: 'center' }}
      >
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>No score data available.</p>
      </div>
    );
  }

  // Build 10 equal-width buckets
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const bucketSize = range / 10;

  const labels = [];
  const counts = new Array(10).fill(0);

  for (let i = 0; i < 10; i++) {
    const lo = min + i * bucketSize;
    const hi = lo + bucketSize;
    labels.push(`${Math.round(lo)}–${Math.round(hi)}`);
  }

  for (const s of scores) {
    const idx = Math.min(9, Math.floor((s - min) / bucketSize));
    counts[idx]++;
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Reports',
        data: counts,
        backgroundColor: 'rgba(139, 92, 246, 0.65)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y} report${ctx.parsed.y !== 1 ? 's' : ''}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8', font: { size: 11 }, stepSize: 1 },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  };

  return (
    <div
      className="surface"
      style={{ padding: '1.5rem', borderRadius: 'var(--r-lg)', background: 'var(--surface-bg)' }}
    >
      <p
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-soft)',
          marginBottom: '1rem',
        }}
      >
        Score Distribution
      </p>
      <Bar data={data} options={options} />
    </div>
  );
}
