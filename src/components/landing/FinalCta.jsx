import { Link, ROUTES } from '../../lib/router.jsx';

export default function FinalCta() {
  return (
    <section className="final-cta" aria-labelledby="final-title">
      <div className="container final-cta-inner">
        <svg className="final-route" viewBox="0 0 400 120" aria-hidden="true">
          <path d="M8 104 C 120 104, 140 20, 240 40 S 360 16, 392 16" />
          <circle cx="8" cy="104" r="6" className="node-open" />
          <circle cx="392" cy="16" r="7" className="node-fill" />
        </svg>
        <h2 id="final-title">El futuro del fitness se construye conectado</h2>
        <p className="lead">
          Gestiona mejor tu gimnasio y conecta con nuevas oportunidades dentro del ecosistema fitness venezolano.
        </p>
        <div className="hero-actions hero-actions--center">
          <Link to={ROUTES.affiliation} className="btn btn--primary btn--lg">Afiliar mi gimnasio</Link>
          <Link to={ROUTES.explore} className="btn btn--ghost btn--lg">Explorar gimnasios</Link>
        </div>
      </div>
    </section>
  );
}
