import GymSearchForm from '../components/landing/GymSearchForm.jsx';
import DemoNotice from '../components/ui/DemoNotice.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useRequireLogin, LoadingPage } from '../auth/RequireGymAdmin.jsx';
import { Link, buildPath, ROUTES } from '../lib/router.jsx';
import { ATHLETE_ROADMAP } from '../data/landing.js';

/**
 * Espacio del atleta. Hoy ofrece lo que funciona (buscar gimnasios y ver perfiles)
 * y muestra como «Próximamente» lo que llega en la fase 4, sin simularlo.
 */
const UPCOMING = {
  'Reservas de clases': { icon: 'calendar', text: 'Reserva cupos en las clases de tu gimnasio y cancela si no puedes ir.' },
  'Gimnasios favoritos': { icon: 'star', text: 'Guarda los gimnasios que te interesan para compararlos.' },
  'Membresías desde tu cuenta': { icon: 'refresh', text: 'Consulta tu plan, sus pagos y cuándo vence.' },
  'Seguimiento de entrenamientos': { icon: 'chart', text: 'Registra tus sesiones y mira tu progreso.' },
};

export default function AccountPage() {
  const { ready } = useRequireLogin();
  const { user, isDemoSession } = useAuth();
  if (!ready) return <LoadingPage />;

  const firstName = (user.name || user.email || '').split(/[\s@]/)[0];

  return (
    <div className="page">
      <div className="container">
        {isDemoSession && (
          <DemoNotice><strong>Sesión de demostración como atleta.</strong> No es una cuenta real: así se verá tu espacio cuando las cuentas estén activas.</DemoNotice>
        )}
        <header className="page-header">
          <h1>Hola, {firstName}</h1>
          <p className="lead">Encuentra dónde entrenar y, muy pronto, gestiona tus reservas y tu membresía desde aquí.</p>
        </header>

        <section aria-labelledby="buscar-t">
          <h2 id="buscar-t" className="visually-hidden">Buscar gimnasios</h2>
          <GymSearchForm compact />
        </section>

        <div className="account-grid">
          <article className="account-card account-card--wide">
            <h2><Icon name="pin" size={20} />Gimnasios para ti</h2>
            <p>Explora los gimnasios afiliados, compara sus planes y conoce a sus entrenadores.</p>
            <div className="hero-actions">
              <Link to={ROUTES.explore} className="btn btn--primary">Explorar gimnasios</Link>
              {isDemoSession && (
                <Link to={buildPath(ROUTES.gymProfile, { slug: 'demo' })} className="btn btn--ghost">Ver el gimnasio de demostración</Link>
              )}
            </div>
          </article>

          {ATHLETE_ROADMAP.map((title) => (
            <article key={title} className="account-card">
              <h2><Icon name={UPCOMING[title]?.icon || 'route'} size={20} />{title}</h2>
              <p>{UPCOMING[title]?.text}</p>
              <span className="soon">Próximamente</span>
            </article>
          ))}

          <article className="account-card">
            <h2><Icon name="users" size={20} />Mi cuenta</h2>
            <p>{user.email}</p>
            <span className="soon">Edición de datos: próximamente</span>
          </article>

          <article className="account-card">
            <h2><Icon name="store" size={20} />¿Tienes un gimnasio?</h2>
            <p>Afílialo a Rutine para gestionar pagos, membresías y entrenadores.</p>
            <Link to={ROUTES.affiliation} className="btn btn--ghost btn--small">Afiliar mi gimnasio</Link>
          </article>
        </div>
      </div>
    </div>
  );
}
