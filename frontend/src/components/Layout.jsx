/**
 * Layout.jsx — "Nebula Dark" redesign
 * Footer: glassmorphism surface, live data chip, upgraded brand row.
 */
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopNav from './ui/TopNav';

const footerLinks = [
  { to: '/dashboard',   key: 'nav.dashboard' },
  { to: '/leaderboard', key: 'nav.leaderboard' },
  { to: '/compare',     key: 'nav.compare' },
  { to: '/submit',      key: 'nav.submit' }
];

export default function Layout() {
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <TopNav />

      <main className="container-shell pb-12 pt-6 sm:pt-8">
        <Outlet />
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="footer-shell">
        <div className="container-shell">
          <div className="surface-muted px-5 py-7 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

              {/* Brand identity */}
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="logo-mark">PB</div>
                  <div>
                    <div className="font-display text-base font-bold tracking-tight gradient-title">
                      {t('app.name')}
                    </div>
                    <div className="text-xs text-soft">{t('app.tagline')}</div>
                  </div>
                </div>
                <p className="mt-3 max-w-md text-sm text-muted" style={{ lineHeight: 1.75 }}>
                  {t('footer.desc')}
                </p>
              </div>

              {/* Navigation links */}
              <nav className="flex flex-wrap gap-2">
                {footerLinks.map((item) => (
                  <Link key={item.to} to={item.to} className="btn btn-ghost text-sm">
                    {t(item.key)}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Bottom bar */}
            <div
              className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-xs text-soft"
              style={{ borderColor: 'var(--line-dim)' }}
            >
              <span>© {new Date().getFullYear()} {t('app.name')} — {t('footer.rights')}</span>
              <span className="chip chip-live" style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                Live Data
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

