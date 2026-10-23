import { useSyncExternalStore } from 'react';

/**
 * Enrutador mínimo basado en la History API.
 * Se usa en lugar de una librería para no añadir dependencias a una landing.
 * Si el proyecto crece (rutas anidadas, loaders, rutas protegidas),
 * conviene migrar a react-router sin cambiar los nombres de las rutas.
 *
 * Modo hash: la vista previa en un único archivo define
 * window.__RUTINE_HASH_ROUTER__ = true para poder navegar sin servidor.
 */
const HASH_MODE = typeof window !== 'undefined' && Boolean(window.__RUTINE_HASH_ROUTER__);
const NAV_EVENT = 'rutine:navigate';

export const ROUTES = {
  home: '/',
  explore: '/gimnasios',
  affiliation: '/afiliacion',
  access: '/acceso',
};

function readLocation() {
  if (HASH_MODE) {
    const raw = window.location.hash.slice(1) || '/';
    const [path, query = ''] = raw.split('?');
    return `${path.startsWith('/') ? path : '/'}${query ? `?${query}` : ''}`;
  }
  return `${window.location.pathname}${window.location.search}`;
}

function subscribe(callback) {
  window.addEventListener('popstate', callback);
  window.addEventListener('hashchange', callback);
  window.addEventListener(NAV_EVENT, callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener('hashchange', callback);
    window.removeEventListener(NAV_EVENT, callback);
  };
}

export function useLocation() {
  const current = useSyncExternalStore(subscribe, readLocation, () => '/');
  const [path, query = ''] = current.split('?');
  return { path, searchParams: new URLSearchParams(query) };
}

export function hrefFor(to) {
  return HASH_MODE ? `#${to}` : to;
}

export function navigate(to, { replace = false } = {}) {
  const url = hrefFor(to);
  window.history[replace ? 'replaceState' : 'pushState'](null, '', url);
  window.dispatchEvent(new Event(NAV_EVENT));
  window.scrollTo(0, 0);
}

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  // Mover el foco ayuda a quienes navegan con teclado o lector de pantalla.
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  return true;
}

function isModifiedClick(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

/** Enlace a una ruta de la aplicación. */
export function Link({ to, onClick, children, ...rest }) {
  return (
    <a
      href={hrefFor(to)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || isModifiedClick(event)) return;
        event.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/** Enlace a una sección de la página de inicio (funciona desde cualquier ruta). */
export function SectionLink({ section, onClick, children, ...rest }) {
  return (
    <a
      href={HASH_MODE ? `#/` : `/#${section}`}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || isModifiedClick(event)) return;
        event.preventDefault();
        if (readLocation().split('?')[0] === '/') {
          scrollToSection(section);
        } else {
          navigate('/');
          requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(section)));
        }
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
