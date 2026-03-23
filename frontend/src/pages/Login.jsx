import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataCard from '../components/ui/DataCard';
import KPIStat from '../components/ui/KPIStat';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (loginError) {
      setError(loginError.response?.data?.error || t('errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <DataCard className="hidden lg:block">
        <h1 className="font-display text-3xl font-bold gradient-title">{t('auth.login')}</h1>
        <p className="mt-3 text-sm text-muted">{t('auth.loginSubtitle')}</p>

        <div className="mt-6 grid gap-3">
          <KPIStat label={t('auth.loginStatA')} value="50M+" hint={t('auth.loginStatAHint')} />
          <KPIStat label={t('auth.loginStatB')} value="24/7" hint={t('auth.loginStatBHint')} />
          <KPIStat label={t('auth.loginStatC')} value="AA" hint={t('auth.loginStatCHint')} />
        </div>
      </DataCard>

      <DataCard>
        <h2 className="font-display text-2xl font-semibold text-slate-100">{t('auth.login')}</h2>
        <p className="mt-1 text-sm text-muted">{t('auth.loginSubtitle')}</p>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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

          <div>
            <label className="label">{t('auth.password')}</label>
            <input
              type="password"
              className="field"
              value={formData.password}
              onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? t('common.loading') : t('auth.loginBtn')}
          </button>
        </form>

        <p className="mt-5 text-sm text-muted">
          {t('auth.noAccount')} <Link to="/register" className="link">{t('auth.register')}</Link>
        </p>
      </DataCard>
    </div>
  );
}

