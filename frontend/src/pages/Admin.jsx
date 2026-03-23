import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataCard from '../components/ui/DataCard';
import EmptyState from '../components/ui/EmptyState';
import KPIStat from '../components/ui/KPIStat';
import SectionHeader from '../components/ui/SectionHeader';
import Skeleton from '../components/ui/Skeleton';
import TableRow from '../components/ui/TableRow';
import { admin } from '../services/api';

export default function Admin() {
  const { t } = useTranslation();
  const [flags, setFlags] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const [flagsRes, usersRes] = await Promise.all([admin.getFlags(), admin.getUsers()]);
        if (!cancelled) {
          setFlags(flagsRes.data.flagged || []);
          setUsers(usersRes.data.users || []);
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const bannedCount = useMemo(() => users.filter((user) => user.is_banned).length, [users]);
  const verifiedCount = useMemo(() => users.filter((user) => user.is_verified).length, [users]);

  const handleRemoveBenchmark = async (id) => {
    if (!window.confirm(t('admin.removeConfirm'))) return;
    try {
      await admin.removeBenchmark(id);
      setFlags((prev) => prev.filter((entry) => entry.id !== id));
    } catch (error) {
      window.alert(t('admin.removeError'));
    }
  };

  const handleUnflagBenchmark = async (id) => {
    try {
      await admin.unflagBenchmark(id);
      setFlags((prev) => prev.filter((entry) => entry.id !== id));
    } catch (error) {
      window.alert(t('admin.unflagError'));
    }
  };

  const handleBanUser = async (id) => {
    if (!window.confirm(t('admin.banConfirm'))) return;
    try {
      await admin.banUser(id);
      setUsers((prev) => prev.map((entry) => (entry.id === id ? { ...entry, is_banned: 1 } : entry)));
    } catch (error) {
      window.alert(t('admin.banError'));
    }
  };

  const handleUnbanUser = async (id) => {
    try {
      await admin.unbanUser(id);
      setUsers((prev) => prev.map((entry) => (entry.id === id ? { ...entry, is_banned: 0 } : entry)));
    } catch (error) {
      window.alert(t('admin.unbanError'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow={t('nav.admin')}
        title={t('admin.title')}
        subtitle={t('admin.subtitle')}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KPIStat label={t('admin.kpi.flags')} value={flags.length} hint={t('admin.kpi.flagsHint')} />
        <KPIStat label={t('admin.kpi.users')} value={users.length} hint={t('admin.kpi.usersHint')} />
        <KPIStat label={t('admin.kpi.banned')} value={bannedCount} hint={t('admin.kpi.bannedHint')} />
        <KPIStat label={t('admin.kpi.verified')} value={verifiedCount} hint={t('admin.kpi.verifiedHint')} />
      </div>

      <DataCard>
        <h2 className="font-display text-xl font-semibold text-slate-100">{t('admin.flags')}</h2>
        <p className="mt-1 text-sm text-muted">{t('admin.flagsSubtitle')}</p>

        {flags.length > 0 ? (
          <div className="mt-4 space-y-3">
            {flags.map((flag) => (
              <div key={flag.id} className="surface-muted p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-100">{flag.title}</div>
                    <div className="mt-1 text-xs text-muted">
                      {flag.username} - {t('admin.flagCount', { count: flag.flag_count })}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {flag.is_flagged ? (
                      <button type="button" className="btn btn-secondary" onClick={() => handleUnflagBenchmark(flag.id)}>
                        {t('admin.unflag')}
                      </button>
                    ) : null}
                    <button type="button" className="btn btn-danger" onClick={() => handleRemoveBenchmark(flag.id)}>
                      {t('admin.remove')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={t('admin.noFlagsTitle')} description={t('admin.noFlagsDesc')} />
        )}
      </DataCard>

      <DataCard className="!p-3 sm:!p-4">
        <h2 className="px-1 pb-3 font-display text-xl font-semibold text-slate-100">{t('admin.users')}</h2>
        <div className="table-shell scrollbar-thin">
          <table>
            <thead>
              <tr>
                <th>{t('auth.username')}</th>
                <th>{t('auth.email')}</th>
                <th>{t('profile.experience')}</th>
                <th>{t('admin.verified')}</th>
                <th>{t('admin.status')}</th>
                <th>{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((entry) => (
                <TableRow key={entry.id}>
                  <td>{entry.username}</td>
                  <td>{entry.email}</td>
                  <td>{entry.experience_level}</td>
                  <td>{entry.is_verified ? t('admin.yes') : t('admin.no')}</td>
                  <td>{entry.is_banned ? t('admin.banned') : t('admin.active')}</td>
                  <td>
                    {entry.email !== 'admin@pcbenchhub.com' ? (
                      entry.is_banned ? (
                        <button type="button" className="btn btn-secondary" onClick={() => handleUnbanUser(entry.id)}>
                          {t('admin.unban')}
                        </button>
                      ) : (
                        <button type="button" className="btn btn-danger" onClick={() => handleBanUser(entry.id)}>
                          {t('admin.ban')}
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-muted">{t('admin.protected')}</span>
                    )}
                  </td>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>
    </div>
  );
}

