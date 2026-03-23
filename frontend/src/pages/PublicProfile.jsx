import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { profiles } from '../services/api';
import ActivityFeed from '../components/community/ActivityFeed';
import BadgeGrid from '../components/community/BadgeGrid';
import ReputationTier from '../components/community/ReputationTier';
import UserHardwareList from '../components/community/UserHardwareList';
import DataCard from '../components/ui/DataCard';
import EmptyState from '../components/ui/EmptyState';
import KPIStat from '../components/ui/KPIStat';
import SectionHeader from '../components/ui/SectionHeader';
import Skeleton from '../components/ui/Skeleton';

function UserAvatar({ username, avatarUrl, size = 72 }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid rgba(148,115,255,0.3)',
          flexShrink: 0,
        }}
      />
    );
  }

  const initial = username ? username[0].toUpperCase() : '?';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(155,109,255,0.18)',
        border: '2px solid rgba(155,109,255,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 700,
        color: '#b387ff',
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

export default function PublicProfile() {
  const { username } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setProfileData(null);

    profiles
      .getByUsername(username)
      .then((res) => {
        if (!cancelled) setProfileData(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.response?.status === 404) setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="surface p-6">
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="surface p-5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-7 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !profileData) {
    return (
      <EmptyState
        title="Profile not found"
        description={`No user found with the username "${username}".`}
      />
    );
  }

  const { user, badges, hardware, stats } = profileData;

  return (
    <div className="space-y-5 fade-up">
      {/* Header */}
      <DataCard>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
          <UserAvatar username={user.username} avatarUrl={user.avatar_url} size={72} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#eef2ff',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {user.username}
              </h1>

              {user.is_trusted ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '2px 9px',
                    borderRadius: 9999,
                    backgroundColor: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.4)',
                    color: '#f59e0b',
                  }}
                >
                  Trusted
                </span>
              ) : null}
            </div>

            <div style={{ marginTop: 8 }}>
              <ReputationTier
                tier={user.reputation_tier || 'newcomer'}
                score={user.reputation_score || 0}
                showProgress={false}
              />
            </div>

            {user.bio && (
              <p style={{ marginTop: 10, fontSize: 14, color: '#8896b0', lineHeight: 1.6 }}>
                {user.bio}
              </p>
            )}

            {user.created_at && (
              <p style={{ marginTop: 6, fontSize: 12, color: '#4d5d7a' }}>
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </DataCard>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KPIStat
          label="Reports"
          value={stats.report_count}
          hint="Total benchmark reports submitted"
        />
        <KPIStat
          label="Upvotes Received"
          value={stats.upvotes_received}
          hint="Total upvotes across all reports"
        />
        <KPIStat
          label="Badges"
          value={stats.badges_count}
          hint="Badges earned"
        />
      </div>

      {/* Badges */}
      <section className="space-y-4">
        <SectionHeader
          title={`Badges (${badges.length})`}
          subtitle="Community achievements earned by this user"
        />
        <DataCard>
          <BadgeGrid badges={badges} showEarned />
        </DataCard>
      </section>

      {/* Hardware */}
      {hardware.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title="Hardware Setup"
            subtitle="Components in this user's rig"
          />
          <DataCard>
            <UserHardwareList hardware={hardware} editable={false} />
          </DataCard>
        </section>
      )}

      {/* Activity */}
      <section className="space-y-4">
        <SectionHeader
          title="Recent Activity"
          subtitle="Latest actions on PCBenchHub"
        />
        <DataCard>
          <ActivityFeed username={user.username} limit={10} />
        </DataCard>
      </section>
    </div>
  );
}
