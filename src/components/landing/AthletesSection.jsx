import Photo from '../ui/Photo.jsx';
import Icon from '../ui/Icon.jsx';
import { Link, ROUTES } from '../../lib/router.jsx';
import { media } from '../../config/media.js';
import { ATHLETE_FEATURES, ATHLETE_ROADMAP } from '../../data/landing.js';

export default function AthletesSection() {
  return (
    <section id="atletas" className="section athletes" aria-labelledby="atletas-title">
      <div className="container">
        <div className="athletes-stage">
          <Photo image={media.athletes} className="athletes-photo" />
          <div className="athletes-overlay">
            <h2 id="atletas-title">Tu próxima rutina comienza encontrando el lugar adecuado</h2>
            <p className="lead">
              Ya sea tu primera semana o tu décimo año entrenando, Rutine te ayuda a encontrar el gimnasio, la clase y el entrenador que van contigo.
            </p>
            <div className="hero-actions">
              <Link to={ROUTES.explore} className="btn btn--primary btn--lg">Explorar gimnasios</Link>
              <Link to={ROUTES.access} className="btn btn--ghost btn--lg">Acceder a mi cuenta</Link>
            </div>
          </div>
        </div>

        <div className="athletes-grid">
          <ul className="athlete-features">
            {ATHLETE_FEATURES.map((f) => (
              <li key={f.title}>
                <Icon name={f.icon} size={24} />
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
          <div className="roadmap">
            <h3>En camino para atletas</h3>
            <p>Funciones que se incorporarán en próximas etapas:</p>
            <ul>
              {ATHLETE_ROADMAP.map((item) => (
                <li key={item}><Icon name="route" size={18} />{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
