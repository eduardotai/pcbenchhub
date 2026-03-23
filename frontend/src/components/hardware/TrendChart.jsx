import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

/**
 * TrendChart — line chart showing composite score over time.
 *
 * Props:
 *   history  {Array<{ snapshot_date: string, composite_score: number }>}
 */
export default function TrendChart({ history = [] }) {
  if (!history.length) {
    return (
      <div
        className="surface"
        style={{ padding: '1.5rem', borderRadius: 'var(--r-lg)', textAlign: 'center' }}
      >
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>No trend data available.</p>
      </div>
    );
  }

  const sorted = [...history].sort(
    (a, b) => new Date(a.snapshot_date) - new Date(b.snapshot_date)
  );

  const labels = sorted.map((s) => {
    try {
      return new Date(s.snapshot_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return s.snapshot_date;
    }
  });

  const values = sorted.map((s) => Number(s.composite_score) || 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Composite Score',
        data: values,
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: 'rgba(139, 92, 246, 0.10)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        fill: true,
        tension: 0.35,
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
          label: (ctx) => ` Score: ${ctx.parsed.y.toFixed(1)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        min: 0,
        max: 100,
        ticks: { color: '#94a3b8', font: { size: 11 } },
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
        Rating Trend
      </p>
      <Line data={data} options={options} />
    </div>
  );
}
