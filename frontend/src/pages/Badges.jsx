import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { profiles } from '../services/api';
import BadgeGrid from '../components/community/BadgeGrid';
import DataCard from '../components/ui/DataCard';
import SectionHeader from '../components/ui/SectionHeader';
import Skeleton from '../components/ui/Skeleton';

/**
 * Mirror of backend/models/Badge.js BADGE_DEFINITIONS — kept in sync manually.
 * These are the full catalogue of possible badges.
 */
const BADGE_DEFINITIONS = [
  // Milestone
  { name: 'first_report',      display_name: 'First Report',       description: 'Submitted your first report',  icon: '🏆', category: 'milestone', color: '#f59e0b' },
  { name: 'prolific_reporter', display_name: 'Prolific Reporter',  description: 'Submitted 10 reports',          icon: '📊', category: 'milestone', color: '#f59e0b' },
  { name: 'centurion',         display_name: 'Centurion',          description: 'Submitted 100 reports',         icon: '💯', category: 'milestone', color: '#9333ea' },
  // Community
  { name: 'helpful',           display_name: 'Helpful',            description: 'Received 10 upvotes',           icon: '👍', category: 'community', color: '#22c55e' },
  { name: 'community_pillar',  display_name: 'Community Pillar',   description: 'Received 100 upvotes',          icon: '🏛️', category: 'community', color: '#22c55e' },
  // Expertise
  { name: 'gpu_guru',           display_name: 'GPU Guru',          description: '10 GPU reports',                icon: '🎮', category: 'expertise', color: '#3b82f6' },
  { name: 'cpu_expert',         display_name: 'CPU Expert',        description: '10 CPU reports',                icon: '⚡', category: 'expertise', color: '#3b82f6' },
  { name: 'storage_specialist', display_name: 'Storage Specialist',description: '10 Storage reports',            icon: '💾', category: 'expertise', color: '#3b82f6' },
  { name: 'memory_master',      display_name: 'Memory Master',     description: '10 RAM reports',                icon: '🧠', category: 'expertise', color: '#3b82f6' },
  // Special
  { name: 'overclocker',        display_name: 'Overclocker',       description: '5 reports tagged "overclocked"',icon: '🔥', category: 'special',   color: '#ef4444' },
];

export default function Badges() {
  const { user } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.username) {
      setEarnedBadges([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    profiles
      .getBadges(user.username)
      .then((res) => {
        if (!cancelled) setEarnedBadges(res.data.badges || []);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your badges.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.username]);

  const earnedCount = earnedBadges.length;
  const totalCount = BADGE_DEFINITIONS.length;

  return (
    <div className="space-y-5 fade-up">
      <SectionHeader
        eyebrow="Achievements"
        title="Badges"
        subtitle="Earn badges by contributing to PCBenchHub"
      />

      {/* Progress bar (only when logged in) */}
      {user && (
        <DataCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#eef2ff' }}>
              Your Progress
            </span>
            <span style={{ fontSize: 13, color: '#8896b0' }}>
              {earnedCount} / {totalCount} badges
            </span>
          </div>

          <div
            style={{
              height: 8,
              borderRadius: 9999,
              backgroundColor: 'rgba(148,115,255,0.12)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}%`,
                borderRadius: 9999,
                background: 'linear-gradient(90deg, #7c4dff, #9b6dff)',
                transition: 'width 0.5s ease',
                boxShadow: '0 0 8px rgba(155,109,255,0.45)',
              }}
            />
          </div>

          {earnedCount === totalCount && totalCount > 0 && (
            <p style={{ marginTop: 8, fontSize: 13, color: '#9b6dff', fontWeight: 600 }}>
              Congratulations — you have earned every badge!
            </p>
          )}
        </DataCard>
      )}

      {/* Badge grid */}
      <DataCard>
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i}>
                <Skeleton className="mb-3 h-3 w-20" />
                <div style={{ display: 'flex', gap: 12 }}>
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-12 w-12 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p style={{ color: '#f43f5e', fontSize: 13 }}>{error}</p>
        ) : (
          <BadgeGrid
            badges={earnedBadges}
            allBadges={BADGE_DEFINITIONS}
            showEarned
          />
        )}
      </DataCard>

      {/* Description table for non-logged-in users */}
      {!user && (
        <DataCard>
          <p style={{ fontSize: 14, color: '#8896b0', marginBottom: 16 }}>
            Sign in to track which badges you have earned.
          </p>
          <div className="space-y-2">
            {BADGE_DEFINITIONS.map((badge) => (
              <div
                key={badge.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(148,115,255,0.07)',
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{badge.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#eef2ff' }}>
                    {badge.display_name}
                  </div>
                  <div style={{ fontSize: 12, color: '#8896b0' }}>
                    {badge.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      )}
    </div>
  );
}
