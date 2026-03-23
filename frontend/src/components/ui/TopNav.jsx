import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const navConfig = [
  { to: '/', key: 'nav.home' },
  { to: '/hardware', key: 'nav.hardware' },
  { to: '/community', key: 'nav.community' },
  { to: '/collections', key: 'nav.collections' },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon({ open }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

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
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isCondensed, setIsCondensed] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (location.pathname.startsWith('/hardware')) {
      setQuery(params.get('search') || '');
    } else {
      setQuery('');
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleScroll = () => setIsCondensed(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const nextQuery = query.trim();
    const params = new URLSearchParams();
    if (nextQuery) params.set('search', nextQuery);
    setMenuOpen(false);
    navigate(`/hardware${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <header className={cn('nav-shell', isCondensed && 'is-condensed')}>
      <div className="container-shell">
        <div className="nav-bar">
          <div className="nav-brand">
            <Link to="/" className="brand-lockup shrink-0">
              <span className="logo-mark">
                <span className="logo-mark__core">PB</span>
              </span>
              <span className="brand-copy">
                <span className="brand-kicker">PC BenchHub / 03</span>
                <span className="brand-title">{t('app.name')}</span>
                <span className="brand-subtitle">{t('app.tagline')}</span>
              </span>
            </Link>

            <nav className="nav-track hidden lg:flex">
              {navConfig.map((item) => (
                <NavItem key={item.to} to={item.to} exact={item.to === '/'}>
                  {t(item.key)}
                </NavItem>
              ))}
            </nav>
          </div>

          <div className="nav-actions">
            <div className="lang-toggle hidden lg:inline-flex" role="group" aria-label="Language selector">
              {['en', 'pt'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => i18n.changeLanguage(lang)}
                  className={cn('lang-toggle__button', i18n.language === lang && 'is-active')}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {user ? (
              <div className="hidden lg:flex items-center gap-2.5">
                <Link to="/submit" className="btn btn-primary">
                  {t('nav.submit')}
                </Link>
                <Link to="/profile" className="btn btn-secondary">
                  {user.username}
                </Link>
                {user.isAdmin && (
                  <Link to="/admin" className="btn btn-ghost">
                    {t('nav.admin')}
                  </Link>
                )}
                <button type="button" onClick={logout} className="btn btn-ghost">
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2.5">
                <Link to="/login" className="btn btn-ghost">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn btn-primary">
                  {t('nav.register')}
                </Link>
              </div>
            )}

            <button
              type="button"
              className="btn btn-secondary lg:hidden"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t('nav.close') : t('nav.menu')}
            >
              <span className="h-4 w-4">
                <MenuIcon open={menuOpen} />
              </span>
              <span>{menuOpen ? t('nav.close') : t('nav.menu')}</span>
            </button>
          </div>
        </div>

        <form className="site-search" onSubmit={handleSearchSubmit}>
          <div className="site-search__field">
            <span className="site-search__icon">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="site-search__input"
              placeholder={t('nav.searchPlaceholder')}
              aria-label={t('nav.searchPlaceholder')}
            />
          </div>
          <span className="site-search__meta hidden xl:inline">{t('nav.searchFallback')}</span>
          <button type="submit" className="btn btn-secondary site-search__button">
            {t('nav.searchAction')}
          </button>
        </form>

        {menuOpen && (
          <div className="nav-drawer fade-up lg:hidden">
            <nav className="flex flex-col gap-2">
              {navConfig.map((item) => (
                <NavItem key={item.to} to={item.to} exact={item.to === '/'} onClick={() => setMenuOpen(false)}>
                  {t(item.key)}
                </NavItem>
              ))}
            </nav>

            <div className="lang-toggle self-start" role="group" aria-label="Language selector">
              {['en', 'pt'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => i18n.changeLanguage(lang)}
                  className={cn('lang-toggle__button', i18n.language === lang && 'is-active')}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {user ? (
              <>
                <Link to="/submit" className="btn btn-primary">
                  {t('nav.submit')}
                </Link>
                <Link to="/profile" className="btn btn-secondary">
                  {t('nav.profile')}
                </Link>
                {user.isAdmin && (
                  <Link to="/admin" className="btn btn-ghost">
                    {t('nav.admin')}
                  </Link>
                )}
                <button type="button" onClick={logout} className="btn btn-ghost">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn btn-primary">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
