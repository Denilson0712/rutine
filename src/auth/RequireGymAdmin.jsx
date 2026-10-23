import { useEffect } from 'react';
import { useAuth } from './AuthProvider.jsx';
import { canManageGym } from '../lib/workspaces.js';
import { Link, navigate, ROUTES, useLocation } from '../lib/router.jsx';
import Icon from '../components/ui/Icon.jsx';

/** Lleva al login si no hay sesión, recordando a dónde volver. */
export function useRequireLogin() {
  const { loading, user } = useAuth();
  const { path } = useLocation();
  useEffect(() => {
    if (!loading && !user) navigate(`${ROUTES.access}?volver=${encodeURIComponent(path)}`, { replace: true });
  }, [loading, user, path]);
  return { ready: !loading && Boolean(user) };
}

export function LoadingPage() {
  return <div className="page"><div className="container"><div className="skeleton" style={{ height: 240 }} /></div></div>;
}

/**
 * Protege el panel del gimnasio en el cliente (experiencia de usuario).
 * La protección real está en el servidor: RLS y funciones SQL rechazan
 * cualquier operación de quien no administra el gimnasio.
 */
export default function RequireGymAdmin({ gymId, children }) {
  const { workspaces } = useAuth();
  const { ready } = useRequireLogin();
  if (!ready) return <LoadingPage />;
  if (gymId && !canManageGym(workspaces, gymId)) return <Denied />;
  return children;
}

function Denied() {
  return (
    <div className="page">
      <div className="container empty empty--page">
        <span className="empty-icon"><Icon name="lock" size={28} /></span>
        <h1>No tienes acceso a este gimnasio</h1>
        <p>Solo el propietario y los administradores autorizados pueden gestionar sus entrenadores.</p>
        <div className="hero-actions hero-actions--center">
          <Link to={ROUTES.panel} className="btn btn--primary">Ir a mis gimnasios</Link>
          <Link to={ROUTES.home} className="btn btn--ghost">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
