import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import BenchmarkCard from '../components/BenchmarkCard';
import BadgeGrid from '../components/community/BadgeGrid';
import ReputationTier from '../components/community/ReputationTier';
import UserHardwareList from '../components/community/UserHardwareList';
import DataCard from '../components/ui/DataCard';
import EmptyState from '../components/ui/EmptyState';
import FilterChip from '../components/ui/FilterChip';
import KPIStat from '../components/ui/KPIStat';
import SectionHeader from '../components/ui/SectionHeader';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { auth as authApi, benchmarks, profiles } from '../services/api';
import api from '../services/api';
import { buildTrustMeta } from '../viewmodels/benchmarkViewModel';

/**
 * Mirror of BADGE_DEFINITIONS from Badge.js — used to show all badges with
 * earned ones highlighted and the rest dimmed.
 */
const ALL_BADGE_DEFINITIONS = [
  { name: 'first_report',      display_name: 'First Report',        description: 'Submitted your first report',   icon: '🏆', category: 'milestone', color: '#f59e0b' },
  { name: 'prolific_reporter', display_name: 'Prolific Reporter',   description: 'Submitted 10 reports',           icon: '📊', category: 'milestone', color: '#f59e0b' },
  { name: 'centurion',         display_name: 'Centurion',           description: 'Submitted 100 reports',          icon: '💯', category: 'milestone', color: '#9333ea' },
  { name: 'helpful',           display_name: 'Helpful',             description: 'Received 10 upvotes',            icon: '👍', category: 'community', color: '#22c55e' },
  { name: 'community_pillar',  display_name: 'Community Pillar',    description: 'Received 100 upvotes',           icon: '🏛️', category: 'community', color: '#22c55e' },
  { name: 'gpu_guru',           display_name: 'GPU Guru',           description: '10 GPU reports',                 icon: '🎮', category: 'expertise', color: '#3b82f6' },
  { name: 'cpu_expert',         display_name: 'CPU Expert',         description: '10 CPU reports',                 icon: '⚡', category: 'expertise', color: '#3b82f6' },
  { name: 'storage_specialist', display_name: 'Storage Specialist', description: '10 Storage reports',             icon: '💾', category: 'expertise', color: '#3b82f6' },
  { name: 'memory_master',      display_name: 'Memory Master',      description: '10 RAM reports',                 icon: '🧠', category: 'expertise', color: '#3b82f6' },
  { name: 'overclocker',        display_name: 'Overclocker',        description: '5 reports tagged "overclocked"', icon: '🔥', category: 'special',   color: '#ef4444' },
];

const levelOptions = ['beginner', 'intermediate', 'advanced'];

export default function Profile() {
  const { t } = useTranslation();
  const { user, updateUser, refreshProfile } = useAuth();

  const [benchmarksList, setBenchmarksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: user?.username || '',
    experienceLevel: user?.experienceLevel || user?.experience_level || 'beginner',
    hardwareSetup: user?.hardwareSetup || user?.hardware_setup || ''
  });

  // Reputation, badges, and hardware state
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [hardwareList, setHardwareList] = useState([]);
  const [reputationData, setReputationData] = useState({ score: 0, tier: 'newcomer' });

  useEffect(() => {
    if (!user) return;

    setFormData({
      username: user.username || '',
      experienceLevel: user.experienceLevel || user.experience_level || 'beginner',
      hardwareSetup: user.hardwareSetup || user.hardware_setup || ''
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    benchmarks
      .getByUser(user.id)
      .then((res) => {
        if (!cancelled) {
          setBenchmarksList(res.data.benchmarks || []);
        }
      })
      .catch((fetchError) => console.error('Failed to fetch profile submissions:', fetchError))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fetch public profile data: badges, hardware, reputation
  useEffect(() => {
    if (!user?.username) return;

    let cancelled = false;

    profiles
      .getByUsername(user.username)
      .then((res) => {
        if (!cancelled) {
          const { badges, hardware, user: profileUser } = res.data;
          setEarnedBadges(badges || []);
          setHardwareList(hardware || []);
          setReputationData({
            score: profileUser?.reputation_score || 0,
            tier: profileUser?.reputation_tier || 'newcomer',
          });
        }
      })
      .catch(() => {
        // Non-critical: silently ignore if profile endpoint not yet registered
      });

    return () => {
      cancelled = true;
    };
  }, [user?.username]);

  // Hardware mutation handlers
  const handleHardwareAdd = useCallback((newItem) => {
    setHardwareList((prev) => [...prev, newItem]);
  }, []);

  const handleHardwareRemove = useCallback(async (componentId) => {
    if (!user?.username) return;
    try {
      await api.delete(`/profiles/${user.username}/hardware/${componentId}`);
      setHardwareList((prev) => prev.filter((h) => h.component_id !== componentId));
    } catch (err) {
      console.error('Failed to remove hardware:', err);
    }
  }, [user?.username]);

  const handleHardwareSetPrimary = useCallback(async (componentId) => {
    if (!user?.username) return;
    try {
      const res = await api.put(`/profiles/${user.username}/hardware/${componentId}/primary`);
      setHardwareList(res.data.hardware || []);
    } catch (err) {
      console.error('Failed to set primary hardware:', err);
    }
  }, [user?.username]);

  const trustAverage = useMemo(() => {
    if (!benchmarksList.length) return 0;
    const total = benchmarksList.reduce((sum, benchmark) => sum + buildTrustMeta(benchmark).score, 0);
    return Math.round(total / benchmarksList.length);
  }, [benchmarksList]);

  const categoriesCount = useMemo(() => {
    return new Set(benchmarksList.map((benchmark) => benchmark.category)).size;
  }, [benchmarksList]);

  const handleSave = async () => {
    setError('');
    setSaving(true);

    try {
      await authApi.updateProfile(formData);
      updateUser(formData);
      await refreshProfile();
      setEditing(false);
    } catch (saveError) {
      setError(saveError.response?.data?.error || t('profile.updateError'));
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <EmptyState title={t('errors.unauthorized')} description={t('profile.loginRequired')} />;
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow={t('nav.profile')}
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KPIStat label={t('profile.kpi.submissions')} value={benchmarksList.length} hint={t('profile.kpi.submissionsHint')} />
        <KPIStat label={t('profile.kpi.categories')} value={categoriesCount} hint={t('profile.kpi.categoriesHint')} />
        <KPIStat label={t('profile.kpi.trust')} value={`${trustAverage}%`} hint={t('profile.kpi.trustHint')} />
        <KPIStat label={t('profile.kpi.level')} value={t(`profile.${formData.experienceLevel}`)} hint={t('profile.kpi.levelHint')} />
      </div>

      <DataCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-slate-100">{t('profile.infoTitle')}</h2>
          {!editing ? (
            <button type="button" onClick={() => setEditing(true)} className="btn btn-secondary">
              {t('profile.editProfile')}
            </button>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={handleSave} className="btn btn-primary" disabled={saving}>
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          )}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t('auth.email')}</label>
            <div className="surface-muted px-3 py-2 text-sm text-slate-100">{user.email}</div>
          </div>

          <div>
            <label className="label">{t('auth.username')}</label>
            {editing ? (
              <input
                type="text"
                className="field"
                value={formData.username}
                onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
              />
            ) : (
              <div className="surface-muted px-3 py-2 text-sm text-slate-100">{formData.username}</div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="label">{t('profile.experience')}</label>
            {editing ? (
              <div className="flex flex-wrap gap-2">
                {levelOptions.map((level) => (
                  <FilterChip
                    key={level}
                    active={formData.experienceLevel === level}
                    onClick={() => setFormData((prev) => ({ ...prev, experienceLevel: level }))}
                  >
                    {t(`profile.${level}`)}
                  </FilterChip>
                ))}
              </div>
            ) : (
              <div className="surface-muted px-3 py-2 text-sm text-slate-100">{t(`profile.${formData.experienceLevel}`)}</div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="label">{t('profile.hardware')}</label>
            {editing ? (
              <textarea
                className="field"
                rows={3}
                value={formData.hardwareSetup}
                onChange={(event) => setFormData((prev) => ({ ...prev, hardwareSetup: event.target.value }))}
              />
            ) : (
              <div className="surface-muted px-3 py-2 text-sm text-slate-100">
                {formData.hardwareSetup || t('profile.noHardwareSet')}
              </div>
            )}
          </div>
        </div>
      </DataCard>

      {/* Reputation & Badges */}
      <section className="space-y-4">
        <SectionHeader
          title="Reputation & Badges"
          subtitle="Your standing in the PCBenchHub community"
        />
        <DataCard>
          <div className="space-y-5">
            {/* Reputation tier with progress */}
            <div>
              <div className="label mb-2">Reputation</div>
              <ReputationTier
                tier={reputationData.tier}
                score={reputationData.score}
                showProgress
              />
            </div>

            {/* Badge grid */}
            <div>
              <div className="label mb-3">
                Badges ({earnedBadges.length}/{ALL_BADGE_DEFINITIONS.length})
              </div>
              <BadgeGrid
                badges={earnedBadges}
                allBadges={ALL_BADGE_DEFINITIONS}
                showEarned
              />
            </div>
          </div>
        </DataCard>
      </section>

      {/* Personal Hardware (editable) */}
      <section className="space-y-4">
        <SectionHeader
          title="Your Hardware"
          subtitle="Components linked to your profile"
        />
        <DataCard>
          <UserHardwareList
            hardware={hardwareList}
            editable
            username={user.username}
            onAdd={handleHardwareAdd}
            onRemove={handleHardwareRemove}
            onSetPrimary={handleHardwareSetPrimary}
          />
        </DataCard>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title={`${t('profile.submissions')} (${benchmarksList.length})`}
          subtitle={t('profile.submissionsSubtitle')}
        />

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="surface p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-6 w-10/12" />
                <Skeleton className="mt-5 h-2 w-full" />
              </div>
            ))}
          </div>
        ) : benchmarksList.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {benchmarksList.map((benchmark) => (
              <BenchmarkCard key={benchmark.id} benchmark={benchmark} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('profile.emptyTitle')}
            description={t('profile.emptyDesc')}
          />
        )}
      </section>
    </div>
  );
}

