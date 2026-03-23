/**
 * TopNav.jsx — "Nebula Dark" redesign
 *
 * Design decisions:
 * - Gradient logo mark (violet → purple) with glow — instant brand recognition
 * - Nav items use .nav-item class with active state (purple glass pill)
 * - Frosted glass bar: nav-shell class handles backdrop-blur + border
 * - Mobile menu: fade-up stagger animation
 * - Language switcher: compact pill buttons (not a clunky select box)
 */
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const navConfig = [
  { to: '/',          key: 'nav.home' },
  { to: '/hardware',  key: 'nav.hardware' },
  { to: '/community', key: 'nav.community' },
  { to: '/collections', key: 'nav.collections' },
];

function NavItem({ to, children, onClick, exact = false }) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive }) => cn('nav-item', isActive && 'active')}
    >
      {children}
    </NavLink>
  );
}

export default function TopNav() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  return (
    <header className="nav-shell">
      <div className="container-shell py-3">
        <div className="flex items-center justify-between gap-3">

          {/* Left: Logo + Desktop Nav */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="logo-mark">PB</div>
              <div className="hidden sm:block">
                <div className="font-display text-sm font-bold tracking-tight gradient-title" style={{ lineHeight: 1.2 }}>
                  {t('app.name')}
                </div>
                <div className="text-xs text-soft">{t('app.tagline')}</div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5">
              {navConfig.map((item) => (
                <NavItem key={item.to} to={item.to} exact={item.to === '/'}>
                  {t(item.key)}
                </NavItem>
              ))}
            </nav>
          </div>

          {/* Right: Language + Auth (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Language pill switcher */}
            <div className="flex items-center rounded-full border" style={{ borderColor: 'var(--line-dim)', background: 'rgba(10,16,28,0.80)' }}>
              {['en', 'pt'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => i18n.changeLanguage(lang)}
                  className="px-3 py-1 text-xs font-semibold rounded-full transition-all"
                  style={i18n.language === lang
                    ? { background: 'linear-gradient(135deg, var(--accent-dim), var(--accent))', color: '#fff' }
                    : { color: 'var(--text-soft)' }
                  }
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {user ? (
              <>
                <Link to="/submit" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                  <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>+</span>
                  {t('nav.submit')}
                </Link>
                <Link to="/profile" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  {user.username}
                </Link>
                {user.isAdmin && (
                  <Link to="/admin" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
                    {t('nav.admin')}
                  </Link>
                )}
                <button type="button" onClick={logout} className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="btn btn-secondary lg:hidden"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            <span style={{ fontSize: '1rem' }}>{menuOpen ? '✕' : '☰'}</span>
            <span>{menuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="mt-3 space-y-3 border-t pt-4 fade-up lg:hidden" style={{ borderColor: 'var(--line-dim)' }}>
            <div className="flex flex-wrap gap-1.5">
              {navConfig.map((item) => (
                <NavItem key={item.to} to={item.to} exact={item.to === '/'} onClick={() => setMenuOpen(false)}>
                  {t(item.key)}
                </NavItem>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {['en', 'pt'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => i18n.changeLanguage(lang)}
                  className={cn('btn text-xs', i18n.language === lang ? 'btn-secondary' : 'btn-ghost')}
                  style={{ padding: '0.35rem 0.75rem' }}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {user ? (
              <div className="flex flex-wrap gap-2">
                <Link to="/submit" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  + {t('nav.submit')}
                </Link>
                <Link to="/profile" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  {t('nav.profile')}
                </Link>
                {user.isAdmin && (
                  <Link to="/admin" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
                    {t('nav.admin')}
                  </Link>
                )}
                <button type="button" onClick={logout} className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Link to="/login" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
