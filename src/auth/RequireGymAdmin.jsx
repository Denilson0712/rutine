import { useEffect } from 'react';
import { useAuth } from './AuthProvider.jsx';
import { canManageGym } from '../lib/workspaces.js';
import { Link, navigate, ROUTES } from '../lib/router.jsx';
import Icon from '../components/ui/Icon.jsx';

/**
 * Protege rutas del panel en el cliente (experiencia de usuario).
 * La protección real está en el servidor: RLS y funciones SQL rechazan
 * cualquier operación de quien no administra el gimnasio.
 * En modo demostración deja pasar solo al gimnasio de demostración.
 */
export default function RequireGymAdmin({ gymId, children }) {
  const { loading, user, workspaces, backendConfigured } = useAuth();

  useEffect(() => {
    if (backendConfigured && !loading && !user) {
      const back = encodeURIComponent(window.location.pathname);
      navigate(`${ROUTES.access}?volver=${back}`, { replace: true });
    }
  }, [backendConfigured, loading, user]);

  if (!backendConfigured) {
    return gymId === 'demo' ? children : <Denied />;
  }
  if (loading || !user) {
    return <div className="page"><div className="container"><div className="skeleton" style={{ height: 240 }} /></div></div>;
  }
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
