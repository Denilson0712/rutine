import { useAsync } from '../GymProfilePage.jsx';
import Icon from '../../components/ui/Icon.jsx';
import DemoNotice from '../../components/ui/DemoNotice.jsx';
import { Link, buildPath, ROUTES } from '../../lib/router.jsx';
import { listManageableGyms, panelIsDemo } from '../../services/panelTrainers.js';
import { useRequireLogin, LoadingPage } from '../../auth/RequireGymAdmin.jsx';
import { useAuth } from '../../auth/AuthProvider.jsx';

const STATUS_LABEL = {
  draft: 'Borrador', submitted: 'Solicitud enviada', under_review: 'En revisión',
  approved: 'Aprobado', rejected: 'Rechazado', suspended: 'Suspendido',
};

/** Selector de gimnasio: una persona puede administrar varios sin duplicar cuentas. */
export default function PanelHomePage() {
  const { ready } = useRequireLogin();
  const { workspaces } = useAuth();
  // En demostración, los gimnasios salen de la sesión de prueba (un atleta no tiene ninguno).
  const load = () => {
    if (!ready) return Promise.resolve([]);
    if (panelIsDemo) return Promise.resolve((workspaces?.gyms || []).filter((g) => ['owner', 'manager'].includes(g.role)));
    return listManageableGyms();
  };
  const state = useAsync(load, [ready, workspaces]);
  if (!ready) return <LoadingPage />;

  return (
    <div className="page">
      <div className="container">
        {panelIsDemo && (
          <DemoNotice><strong>Modo demostración.</strong> Sin servidor conectado solo está disponible el gimnasio de demostración.</DemoNotice>
        )}
        <header className="page-header">
          <h1>Mis gimnasios</h1>
          <p className="lead">Elige el gimnasio que quieres administrar.</p>
        </header>
        {state.status === 'loading' && <div className="skeleton" style={{ height: 120 }} />}
        {state.status === 'error' && <p className="field-error">{state.error.message}</p>}
        {state.status === 'done' && state.data.length === 0 && (
          <div className="empty">
            <span className="empty-icon"><Icon name="store" size={28} /></span>
            <h2>No administras ningún gimnasio</h2>
            <p>Si eres propietario, solicita la afiliación de tu gimnasio. Si eres parte del personal, pide una invitación al propietario.</p>
            <Link to={ROUTES.affiliation} className="btn btn--primary">Afiliar mi gimnasio</Link>
          </div>
        )}
        {state.status === 'done' && state.data.length > 0 && (
          <ul className="gym-list">
            {state.data.map((g) => (
              <li key={g.gym_id} className="gym-card">
                <h2><Link className="card-link" to={buildPath(ROUTES.panelTrainers, { gymId: g.gym_id })}>{g.trade_name}</Link></h2>
                <p>{g.role === 'owner' ? 'Propietario' : 'Administrador'} · {STATUS_LABEL[g.affiliation_status]}</p>
                <span className="trainer-tile-cta" aria-hidden="true">Administrar</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
