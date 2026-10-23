import { Link, ROUTES } from '../../lib/router.jsx';
import Photo from '../ui/Photo.jsx';
import DemoBadge from '../ui/DemoBadge.jsx';
import Icon from '../ui/Icon.jsx';
import { media } from '../../config/media.js';

const LINES = ['Tu gimnasio.', 'Tu progreso.', 'Todo conectado.'];

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1 id="hero-title" className="hero-title">
            {LINES.map((line, i) => (
              <span key={line} className="hero-line" style={{ '--i': i }}>
                <span className="hero-node" aria-hidden="true" />
                {line}
              </span>
            ))}
          </h1>
          <p className="hero-lead">
            Rutine reúne la gestión de gimnasios y la búsqueda de dónde entrenar en una sola plataforma para Venezuela.
            Pagos, membresías, entrenadores y horarios para los gimnasios; gimnasios cerca de ti para los atletas.
          </p>
          <div className="hero-actions">
            <Link to={ROUTES.affiliation} className="btn btn--primary btn--lg">Afiliar mi gimnasio</Link>
            <Link to={ROUTES.explore} className="btn btn--ghost btn--lg">Explorar gimnasios</Link>
          </div>
        </div>

        <div className="hero-visual">
          <Photo image={media.hero} className="hero-photo" eager />

          <div className="hero-card hero-card--session" aria-hidden="true">
            <div className="hero-card-head">
              <Icon name="calendar" size={18} />
              <span>Fuerza · 6:00 p. m.</span>
            </div>
            <div className="meter" style={{ '--fill': '75%' }}>
              <span />
            </div>
            <p className="hero-card-foot"><strong>12</strong> de 16 cupos reservados</p>
          </div>

          <div className="hero-card hero-card--pay" aria-hidden="true">
            <div className="hero-card-head">
              <Icon name="wallet" size={18} />
              <span>Pagos de la semana</span>
            </div>
            <ul className="mini-status">
              <li><span className="dot dot--ok" />Al día <strong>41</strong></li>
              <li><span className="dot dot--warn" />Por vencer <strong>6</strong></li>
              <li><span className="dot dot--late" />Pendientes <strong>3</strong></li>
            </ul>
          </div>

          <div className="hero-visual-badge">
            <DemoBadge>Vista ilustrativa del panel</DemoBadge>
          </div>
        </div>
      </div>
    </section>
  );
}
