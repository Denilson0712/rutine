import { Link, ROUTES } from '../lib/router.jsx';

export default function NotFoundPage() {
  return (
    <div className="page">
      <div className="container empty empty--page">
        <h1>Esta página no existe</h1>
        <p>Puede que el enlace esté mal escrito o que la página se haya movido.</p>
        <div className="hero-actions hero-actions--center">
          <Link to={ROUTES.home} className="btn btn--primary">Ir al inicio</Link>
          <Link to={ROUTES.explore} className="btn btn--ghost">Explorar gimnasios</Link>
        </div>
      </div>
    </div>
  );
}
