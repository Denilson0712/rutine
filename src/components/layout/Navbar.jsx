import { useEffect, useRef, useState } from 'react';
import Logo from '../ui/Logo.jsx';
import Icon from '../ui/Icon.jsx';
import { Link, SectionLink, ROUTES, navigate } from '../../lib/router.jsx';
import { useAuth } from '../../auth/AuthProvider.jsx';

const SECTION_LINKS = [
  { section: 'explorar', label: 'Explorar gimnasios' },
  { section: 'gimnasios', label: 'Para gimnasios' },
  { section: 'entrenadores', label: 'Para entrenadores' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, workspaces, signOut } = useAuth();
  const hasPanel = (workspaces?.gyms || []).length > 0;
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef(null);
  const close = () => setOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onResize = () => window.innerWidth > 960 && setOpen(false);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    document.body.classList.add('menu-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.classList.remove('menu-open');
    };
  }, [open]);

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''} ${open ? 'navbar--open' : ''}`}>
      <div className="container navbar-inner">
        <Logo onClick={close} />

        <nav className="navbar-nav" aria-label="Principal">
          <ul id="menu-principal" className="navbar-links">
            <li>
              <Link to={ROUTES.home} onClick={close}>Inicio</Link>
            </li>
            {SECTION_LINKS.map((item) => (
              <li key={item.section}>
                <SectionLink section={item.section} onClick={close}>{item.label}</SectionLink>
              </li>
            ))}
            {user ? (
              <>
                {hasPanel && (
                  <li className="navbar-links-login">
                    <Link to={ROUTES.panel} onClick={close}>Mi panel</Link>
                  </li>
                )}
                <li className={hasPanel ? '' : 'navbar-links-login'}>
                  <button type="button" className="nav-button" onClick={async () => { close(); await signOut(); navigate(ROUTES.home); }}>
                    Cerrar sesión
                  </button>
                </li>
              </>
            ) : (
              <li className="navbar-links-login">
                <Link to={ROUTES.access} onClick={close}>Iniciar sesión</Link>
              </li>
            )}
            <li className="navbar-links-cta">
              <Link to={ROUTES.affiliation} className="btn btn--primary" onClick={close}>
                Afiliar mi gimnasio
              </Link>
            </li>
          </ul>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="navbar-toggle"
          aria-expanded={open}
          aria-controls="menu-principal"
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? 'close' : 'menu'} />
          <span className="visually-hidden">{open ? 'Cerrar menú' : 'Abrir menú'}</span>
        </button>
      </div>
    </header>
  );
}
