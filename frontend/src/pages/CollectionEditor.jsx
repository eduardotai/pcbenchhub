import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collections } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataCard from '../components/ui/DataCard';
import EmptyState from '../components/ui/EmptyState';
import SectionHeader from '../components/ui/SectionHeader';
import Skeleton from '../components/ui/Skeleton';

export default function CollectionEditor() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: true,
  });

  const ownerAllowed = useMemo(() => {
    if (!isEditMode) return true;
    return Boolean(user);
  }, [isEditMode, user]);

  useEffect(() => {
    if (!isEditMode || !id) return;

    let cancelled = false;

    async function loadCollection() {
      try {
        setLoading(true);
        setError('');
        const res = await collections.getById(id);
        const current = res.data.collection;

        if (!current) {
          throw new Error('Collection not found');
        }

        if (!cancelled) {
          if (!user || String(current.user_id) !== String(user.id)) {
            setError(t('collections.messages.editForbidden', 'You can only edit your own collections.'));
            return;
          }

          setFormData({
            title: current.title || '',
            description: current.description || '',
            isPublic: Boolean(current.is_public),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message || t('collections.messages.loadError', 'Failed to load collection.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCollection();

    return () => {
      cancelled = true;
    };
  }, [id, isEditMode, t, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      setError(t('collections.messages.titleRequired', 'Title is required.'));
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        isPublic: formData.isPublic,
      };

      if (isEditMode) {
        await collections.update(id, payload);
        navigate(`/collections/${id}`);
      } else {
        const res = await collections.create(payload);
        const created = res.data.collection;
        navigate(`/collections/${created.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('collections.messages.saveError', 'Failed to save collection.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;
    if (!window.confirm(t('collections.messages.deleteConfirm', 'Delete this collection permanently?'))) {
      return;
    }

    try {
      setDeleting(true);
      setError('');
      await collections.delete(id);
      navigate('/collections');
    } catch (err) {
      setError(err.response?.data?.error || t('collections.messages.deleteError', 'Failed to delete collection.'));
    } finally {
      setDeleting(false);
    }
  };

  if (!ownerAllowed) {
    return (
      <EmptyState
        title={t('errors.unauthorized', 'Unauthorized')}
        description={t('collections.messages.editForbidden', 'You can only edit your own collections.')}
        action={<Link to="/collections" className="btn btn-secondary">{t('collections.backToList', 'Back to Collections')}</Link>}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        eyebrow={t('collections.eyebrow', 'Community Collections')}
        title={isEditMode ? t('collections.actions.editCollection', 'Edit collection') : t('collections.actions.newCollection', 'Create collection')}
        subtitle={t('collections.editorSubtitle', 'Curate a set of hardware and reports for the community.')}
      />

      <DataCard>
        {error ? (
          <div className="mb-4 rounded-xl border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label">{t('collections.fields.title', 'Title')}</label>
            <input
              type="text"
              className="field"
              value={formData.title}
              onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
              maxLength={120}
              required
            />
          </div>

          <div>
            <label className="label">{t('collections.fields.description', 'Description')}</label>
            <textarea
              className="field"
              rows={4}
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              maxLength={1000}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isPublic"
              type="checkbox"
              checked={formData.isPublic}
              onChange={(event) => setFormData((prev) => ({ ...prev, isPublic: event.target.checked }))}
            />
            <label htmlFor="isPublic" className="text-sm text-slate-200">
              {t('collections.fields.public', 'Public collection')}
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button type="submit" className="btn btn-primary" disabled={saving || deleting}>
              {saving ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
            </button>

            <Link to={isEditMode ? `/collections/${id}` : '/collections'} className="btn btn-ghost">
              {t('common.cancel', 'Cancel')}
            </Link>

            {isEditMode && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDelete}
                disabled={saving || deleting}
                style={{ color: '#f87171' }}
              >
                {deleting ? t('common.loading', 'Loading...') : t('collections.actions.delete', 'Delete')}
              </button>
            )}
          </div>
        </form>
      </DataCard>
    </div>
  );
}
