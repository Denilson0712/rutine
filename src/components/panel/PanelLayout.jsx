import Icon from '../ui/Icon.jsx';
import DemoNotice from '../ui/DemoNotice.jsx';
import { Link, buildPath, ROUTES } from '../../lib/router.jsx';

/**
 * Estructura del panel del gimnasio: menú lateral en escritorio, barra
 * desplazable en móvil. Los módulos que aún no existen se muestran
 * deshabilitados y con su estado, sin simular que funcionan.
 */
const MODULES = [
  { id: 'inicio', label: 'Inicio', icon: 'chart', ready: false },
  { id: 'clientes', label: 'Clientes', icon: 'users', ready: false },
  { id: 'membresias', label: 'Membresías', icon: 'refresh', ready: false },
  { id: 'finanzas', label: 'Finanzas', icon: 'wallet', ready: false },
  { id: 'entrenadores', label: 'Entrenadores', icon: 'trainer', ready: true, route: ROUTES.panelTrainers },
  { id: 'clases', label: 'Clases y reservas', icon: 'calendar', ready: false },
  { id: 'configuracion', label: 'Configuración', icon: 'store', ready: false },
];

export default function PanelLayout({ gym, active, isDemo, children }) {
  return (
    <div className="panel">
      <aside className="panel-side" aria-label="Módulos del gimnasio">
        <div className="panel-gym">
          <span className="panel-gym-name">{gym.trade_name}</span>
          <Link to={ROUTES.panel} className="panel-switch">Cambiar de gimnasio</Link>
        </div>
        <nav>
          <ul className="panel-menu">
            {MODULES.map((m) => (
              <li key={m.id}>
                {m.ready ? (
                  <Link to={buildPath(m.route, { gymId: gym.id })} className={`panel-link ${active === m.id ? 'is-active' : ''}`}
                    aria-current={active === m.id ? 'page' : undefined}>
                    <Icon name={m.icon} size={20} />{m.label}
                  </Link>
                ) : (
                  <span className="panel-link is-disabled" aria-disabled="true" title="Módulo en desarrollo">
                    <Icon name={m.icon} size={20} />{m.label}<small>Pronto</small>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="panel-main">
        {isDemo && (
          <DemoNotice>
            <strong>Modo demostración.</strong> No hay servidor conectado: los cambios se guardan solo en esta pestaña y se pierden al recargar.
          </DemoNotice>
        )}
        {children}
      </div>
    </div>
  );
}
