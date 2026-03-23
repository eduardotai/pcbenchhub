export default function RankBadge({ rank }) {
  const normalized = rank <= 3 ? String(rank) : 'n';

  return (
    <span className="rank-badge" data-rank={normalized}>
      {rank}
    </span>
  );
}

