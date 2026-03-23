import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataCard from '../components/ui/DataCard';
import FilterChip from '../components/ui/FilterChip';
import { useAuth } from '../context/AuthContext';

const levels = ['beginner', 'intermediate', 'advanced'];

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    experienceLevel: 'beginner'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (registerError) {
      setError(registerError.response?.data?.error || t('errors.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <DataCard>
        <h1 className="font-display text-2xl font-semibold text-slate-100">{t('auth.register')}</h1>
        <p className="mt-2 text-sm text-muted">{t('auth.registerSubtitle')}</p>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">{t('auth.username')}</label>
              <input
                type="text"
                className="field"
                value={formData.username}
                onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
                required
                minLength={3}
                maxLength={30}
              />
            </div>

            <div>
              <label className="label">{t('auth.email')}</label>
              <input
                type="email"
                className="field"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">{t('auth.password')}</label>
            <input
              type="password"
              className="field"
              value={formData.password}
              onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="label">{t('profile.experience')}</label>
            <div className="flex flex-wrap gap-2">
              {levels.map((level) => (
                <FilterChip
                  key={level}
                  active={formData.experienceLevel === level}
                  onClick={() => setFormData((prev) => ({ ...prev, experienceLevel: level }))}
                >
                  {t(`profile.${level}`)}
                </FilterChip>
              ))}
            </div>
            <p className="mt-2 text-xs text-soft">{t(`experience.${formData.experienceLevel}Desc`)}</p>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? t('common.loading') : t('auth.registerBtn')}
          </button>
        </form>

        <p className="mt-5 text-sm text-muted">
          {t('auth.hasAccount')} <Link to="/login" className="link">{t('auth.login')}</Link>
        </p>
      </DataCard>
    </div>
  );
}

