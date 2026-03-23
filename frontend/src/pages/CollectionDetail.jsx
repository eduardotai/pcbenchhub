import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collections, hardware } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CollectionItemList from '../components/community/CollectionItemList';
import DataCard from '../components/ui/DataCard';
import EmptyState from '../components/ui/EmptyState';
import SectionHeader from '../components/ui/SectionHeader';
import Skeleton from '../components/ui/Skeleton';

export default function CollectionDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [collection, setCollection] = useState(null);
  const [items, setItems] = useState([]);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [resolvingText, setResolvingText] = useState('');
  const [resolvedComponent, setResolvedComponent] = useState(null);
  const [resolveError, setResolveError] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [reportIdInput, setReportIdInput] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  const fetchCollection = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');
      const res = await collections.getById(id);

      setCollection(res.data.collection || null);
      setItems(res.data.items || []);
      setVoted(Boolean(res.data.voted));
    } catch (err) {
      setError(err.response?.data?.error || t('collections.messages.loadError', 'Failed to load collection.'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const isOwner = useMemo(() => {
    if (!collection || !user) return false;
    return String(collection.user_id) === String(user.id);
  }, [collection, user]);

  const handleVoteToggle = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/collections/${id}` } } });
      return;
    }

    try {
      if (voted) {
        const res = await collections.unvote(id);
        setCollection((prev) => (prev ? { ...prev, upvote_count: res.data.upvote_count ?? prev.upvote_count } : prev));
        setVoted(false);
      } else {
        const res = await collections.vote(id);
        setCollection((prev) => (prev ? { ...prev, upvote_count: res.data.upvote_count ?? prev.upvote_count } : prev));
        setVoted(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('collections.messages.voteError', 'Failed to update vote.'));
    }
  };

  const handleResolveComponent = async () => {
    if (!resolvingText.trim()) return;

    try {
      setResolveError('');
      setResolvedComponent(null);
      const res = await hardware.resolve(resolvingText.trim());
      setResolvedComponent(res.data.component || null);
    } catch (err) {
      setResolveError(err.response?.data?.error || t('community.hardware.resolveError', 'Failed to resolve this hardware name. Try a more specific model.'));
    }
  };

  const handleAddResolvedComponent = async () => {
    if (!resolvedComponent?.id) return;

    try {
      setSavingItem(true);
      const res = await collections.addItem(id, {
        componentId: resolvedComponent.id,
        notes: itemNotes || undefined,
      });

      if (res.data.item) {
        setItems((prev) => [...prev, res.data.item]);
      }

      setResolvingText('');
      setResolvedComponent(null);
      setItemNotes('');
    } catch (err) {
      setResolveError(err.response?.data?.error || t('collections.messages.addItemError', 'Failed to add item.'));
    } finally {
      setSavingItem(false);
    }
  };

  const handleAddReport = async () => {
    if (!reportIdInput.trim()) return;

    try {
      setSavingItem(true);
      const res = await collections.addItem(id, {
        reportId: reportIdInput.trim(),
        notes: itemNotes || undefined,
      });

      if (res.data.item) {
        setItems((prev) => [...prev, res.data.item]);
      }

      setReportIdInput('');
      setItemNotes('');
    } catch (err) {
      setResolveError(err.response?.data?.error || t('collections.messages.addItemError', 'Failed to add item.'));
    } finally {
      setSavingItem(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await collections.removeItem(id, itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      setError(err.response?.data?.error || t('collections.messages.removeItemError', 'Failed to remove item.'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error && !collection) {
    return (
      <EmptyState
        title={t('collections.messages.notFoundTitle', 'Collection not found')}
        description={error}
        action={<Link to="/collections" className="btn btn-secondary">{t('collections.backToList', 'Back to Collections')}</Link>}
      />
    );
  }

  if (!collection) {
    return (
      <EmptyState
        title={t('collections.messages.notFoundTitle', 'Collection not found')}
        description={t('collections.messages.notFoundDescription', 'This collection does not exist or is unavailable.')}
        action={<Link to="/collections" className="btn btn-secondary">{t('collections.backToList', 'Back to Collections')}</Link>}
      />
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between gap-3">
        <SectionHeader
          eyebrow={t('collections.eyebrow', 'Community Collections')}
          title={collection.title}
          subtitle={collection.description || t('collections.messages.noDescription', 'No description provided.')}
        />

        <div className="flex flex-wrap gap-2">
          {isOwner && (
            <Link to={`/collections/${collection.id}/edit`} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              {t('collections.actions.edit', 'Edit')}
            </Link>
          )}
          <button type="button" onClick={handleVoteToggle} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
            {voted ? t('collections.actions.unvote', 'Remove Upvote') : t('collections.actions.vote', 'Upvote')}
            {' · '}
            {collection.upvote_count || 0}
          </button>
        </div>
      </div>

      {error ? (
        <DataCard className="!border-red-300/35 !bg-red-500/10 !p-3 text-sm text-red-100">
          {error}
        </DataCard>
      ) : null}

      <DataCard className="space-y-4">
        <div className="text-sm text-muted">
          {collection.username ? `${t('collections.by', 'By')} ${collection.username}` : null}
          {collection.item_count != null ? ` · ${collection.item_count} ${t('collections.items', 'items')}` : null}
        </div>

        <CollectionItemList
          items={items}
          editable={isOwner}
          onRemove={handleRemoveItem}
        />
      </DataCard>

      {isOwner && (
        <DataCard className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-slate-100">
            {t('collections.actions.addItem', 'Add items to this collection')}
          </h3>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="label">{t('collections.addHardwareLabel', 'Add hardware by name')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="field flex-1"
                  placeholder={t('collections.addHardwarePlaceholder', 'Example: RTX 4080 Super')}
                  value={resolvingText}
                  onChange={(event) => setResolvingText(event.target.value)}
                />
                <button type="button" className="btn btn-secondary" onClick={handleResolveComponent}>
                  {t('collections.actions.resolve', 'Resolve')}
                </button>
              </div>

              {resolvedComponent && (
                <div className="surface-muted px-3 py-2 text-sm text-slate-200">
                  {resolvedComponent.name} ({resolvedComponent.category})
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="label">{t('collections.addReportLabel', 'Add report by ID')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="field flex-1 mono"
                  placeholder={t('collections.addReportPlaceholder', 'Benchmark UUID')}
                  value={reportIdInput}
                  onChange={(event) => setReportIdInput(event.target.value)}
                />
                <button type="button" className="btn btn-secondary" onClick={handleAddReport}>
                  {t('collections.actions.addReport', 'Add')}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="label">{t('collections.notesLabel', 'Item note (optional)')}</label>
            <textarea
              className="field"
              rows={2}
              value={itemNotes}
              onChange={(event) => setItemNotes(event.target.value)}
            />
          </div>

          {resolveError ? (
            <div className="text-sm text-red-300">{resolveError}</div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!resolvedComponent || savingItem}
              onClick={handleAddResolvedComponent}
            >
              {savingItem ? t('common.loading', 'Loading...') : t('collections.actions.addResolved', 'Add resolved hardware')}
            </button>
          </div>
        </DataCard>
      )}

      <div>
        <Link to="/collections" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
          {t('collections.backToList', 'Back to Collections')}
        </Link>
      </div>
    </div>
  );
}
