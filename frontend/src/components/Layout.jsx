import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopNav from './ui/TopNav';

const footerLinks = [
  { to: '/hardware', key: 'nav.hardware' },
  { to: '/community', key: 'nav.community' },
  { to: '/collections', key: 'nav.collections' },
  { to: '/submit', key: 'nav.submit' }
];

function getCurrentSection(pathname, t) {
  if (pathname.startsWith('/hardware/compare')) return `${t('nav.hardware')} / ${t('nav.compare')}`;
  if (pathname.startsWith('/hardware')) return t('nav.hardware');
  if (pathname.startsWith('/community')) return t('nav.community');
  if (pathname.startsWith('/collections')) return t('nav.collections');
  if (pathname.startsWith('/submit')) return t('nav.submit');
  if (pathname.startsWith('/profile') || pathname.startsWith('/u/')) return t('nav.profile');
  if (pathname.startsWith('/badges')) return 'Badges';
  if (pathname.startsWith('/benchmarks/')) return 'Report';
  if (pathname.startsWith('/login')) return t('nav.login');
  if (pathname.startsWith('/register')) return t('nav.register');
  if (pathname.startsWith('/admin')) return t('nav.admin');
  return t('nav.home');
}

export default function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const currentSection = getCurrentSection(location.pathname, t);
  const statusItems = [
    { label: t('footer.currentSectionLabel'), value: currentSection },
    { label: t('footer.statusLabel'), value: t('footer.statusValue') },
    { label: t('footer.nextSliceLabel'), value: t('footer.nextSliceValue') },
  ];

  return (
    <div className="app-shell">
      <TopNav />

      <main className="layout-main">
        <div className="container-shell">
          <div className="layout-grid">
            <aside className="layout-rail">
              <span className="eyebrow-label">Edition 03</span>
              <div className="layout-rail__title">{currentSection}</div>
              <p className="layout-rail__copy">{t('footer.scopeBody')}</p>
              <div className="layout-rail__rule" />
              <div className="layout-rail__meta">
                <span>{t('footer.currentSectionLabel')}</span>
                <strong>{currentSection}</strong>
              </div>
              <div className="layout-rail__meta">
                <span>{t('footer.statusLabel')}</span>
                <strong>{t('footer.statusValue')}</strong>
              </div>
            </aside>

            <div className="layout-stage">
              <div className="layout-stage__intro hidden lg:flex">
                <span className="badge badge-accent">{t('footer.eyebrow')}</span>
                <p className="layout-stage__copy">{t('footer.foundationTitle')}</p>
              </div>
              <Outlet />
            </div>
          </div>
        </div>
      </main>

      <footer className="footer-shell">
        <div className="container-shell">
          <div className="footer-panel">
            <div className="footer-grid">
              <div className="space-y-4">
                <Link to="/" className="brand-lockup">
                  <span className="logo-mark">
                    <span className="logo-mark__core">PB</span>
                  </span>
                  <span className="brand-copy">
                    <span className="brand-kicker">PC BenchHub / 03</span>
                    <span className="brand-title">{t('app.name')}</span>
                    <span className="brand-subtitle">{t('app.tagline')}</span>
                  </span>
                </Link>
                <p className="footer-copy">{t('footer.desc')}</p>
              </div>

              <div className="space-y-4">
                <div className="footer-heading">{t('footer.scopeTitle')}</div>
                <p className="footer-copy">{t('footer.scopeBody')}</p>
                <nav className="footer-links">
                  {footerLinks.map((item) => (
                    <Link key={item.to} to={item.to} className="footer-link">
                      {t(item.key)}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="space-y-4">
                <div className="footer-heading">{t('footer.statusLabel')}</div>
                <div className="footer-metrics">
                  {statusItems.map((item) => (
                    <div key={item.label} className="footer-metric">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <span>Copyright {new Date().getFullYear()} {t('app.name')} - {t('footer.rights')}</span>
              <span>{t('footer.currentSectionLabel')}: {currentSection}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
