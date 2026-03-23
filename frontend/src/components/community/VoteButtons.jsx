import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { votes as votesApi } from '../../services/api';

/**
 * VoteButtons — upvote/downvote controls for a benchmark report.
 *
 * Props:
 *   reportId        {number}  — the benchmark/report ID
 *   initialScore    {number}  — initial total score (default 0)
 *   initialUserVote {number|null} — user's existing vote: 1, -1, or null
 */
export default function VoteButtons({ reportId, initialScore = 0, initialUserVote = null }) {
  const { user } = useAuth();

  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [loading, setLoading] = useState(false);

  // Fetch current counts on mount
  useEffect(() => {
    if (!reportId) return;

    votesApi.getByReport(reportId)
      .then((res) => {
        setUpvotes(res.data.upvotes ?? 0);
        setDownvotes(res.data.downvotes ?? 0);
      })
      .catch(() => {});

    if (user) {
      votesApi.getMyVote(reportId)
        .then((res) => {
          setUserVote(res.data.vote ?? null);
        })
        .catch(() => {});
    }
  }, [reportId, user]);

  const handleVote = useCallback(async (voteType) => {
    if (!user || loading) return;

    // Snapshot for rollback
    const prevUpvotes = upvotes;
    const prevDownvotes = downvotes;
    const prevUserVote = userVote;

    // Optimistic update
    let nextUpvotes = upvotes;
    let nextDownvotes = downvotes;
    let nextUserVote;

    if (userVote === voteType) {
      // Toggle off
      if (voteType === 1) nextUpvotes = Math.max(0, upvotes - 1);
      else nextDownvotes = Math.max(0, downvotes - 1);
      nextUserVote = null;
    } else {
      // Remove previous vote if any
      if (userVote === 1) nextUpvotes = Math.max(0, upvotes - 1);
      if (userVote === -1) nextDownvotes = Math.max(0, downvotes - 1);
      // Add new vote
      if (voteType === 1) nextUpvotes = nextUpvotes + 1;
      else nextDownvotes = nextDownvotes + 1;
      nextUserVote = voteType;
    }

    setUpvotes(nextUpvotes);
    setDownvotes(nextDownvotes);
    setUserVote(nextUserVote);
    setLoading(true);

    try {
      await votesApi.cast(reportId, voteType);
    } catch (err) {
      // Revert on error
      setUpvotes(prevUpvotes);
      setDownvotes(prevDownvotes);
      setUserVote(prevUserVote);
    } finally {
      setLoading(false);
    }
  }, [user, loading, upvotes, downvotes, userVote, reportId]);

  const totalScore = upvotes - downvotes;
  const isDisabled = !user || loading;
  const tooltip = !user ? 'Login to vote' : undefined;

  const upvoteActive = userVote === 1;
  const downvoteActive = userVote === -1;

  return (
    <div className="flex items-center gap-2" title={tooltip}>
      {/* Upvote button */}
      <button
        onClick={() => handleVote(1)}
        disabled={isDisabled}
        title={tooltip}
        className={[
          'flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors',
          upvoteActive
            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
            : 'surface-muted text-muted hover:text-soft border border-transparent hover:border-green-500/30',
          isDisabled && !upvoteActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
        aria-pressed={upvoteActive}
        aria-label={`Upvote (${upvotes})`}
      >
        <span aria-hidden="true">▲</span>
        <span>{upvotes}</span>
      </button>

      {/* Total score */}
      <span
        className={[
          'min-w-[2rem] text-center text-sm font-bold tabular-nums',
          totalScore > 0 ? 'text-green-400' : totalScore < 0 ? 'text-red-400' : 'text-muted',
        ].join(' ')}
        aria-label={`Score: ${totalScore}`}
      >
        {totalScore > 0 ? `+${totalScore}` : totalScore}
      </span>

      {/* Downvote button */}
      <button
        onClick={() => handleVote(-1)}
        disabled={isDisabled}
        title={tooltip}
        className={[
          'flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors',
          downvoteActive
            ? 'bg-red-500/20 text-red-400 border border-red-500/50'
            : 'surface-muted text-muted hover:text-soft border border-transparent hover:border-red-500/30',
          isDisabled && !downvoteActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
        aria-pressed={downvoteActive}
        aria-label={`Downvote (${downvotes})`}
      >
        <span aria-hidden="true">▼</span>
        <span>{downvotes}</span>
      </button>
    </div>
  );
}
