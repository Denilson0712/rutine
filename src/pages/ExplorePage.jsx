import { useEffect, useState } from 'react';
import GymSearchForm from '../components/landing/GymSearchForm.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Link, navigate, useLocation, buildPath, ROUTES } from '../lib/router.jsx';
import { searchGyms } from '../services/gyms.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Stars from '../components/gym/Stars.jsx';
import { mediaUrl } from '../lib/supabase.js';
import { cheapestMembership, formatPrice, priceSuffix } from '../lib/gymFormat.js';

export default function ExplorePage() {
  const { searchParams } = useLocation();
  const { user } = useAuth();
  const filters = {
    estado: searchParams.get('estado') ?? '',
    ciudad: searchParams.get('ciudad') ?? '',
    nombre: searchParams.get('nombre') ?? '',
  };
  const key = `${filters.estado}|${filters.ciudad}|${filters.nombre}`;
  const [state, setState] = useState({ status: 'loading', items: [], connected: false, demoExample: null });

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, status: 'loading' }));
    searchGyms(filters)
      .then((res) => active && setState({ status: 'done', items: res.items, connected: res.connected, demoExample: res.demoExample }))
      .catch(() => active && setState({ status: 'error', items: [], connected: false, demoExample: null }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const where = filters.ciudad || filters.estado || 'Venezuela';

  const onSearch = (next) => {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && params.set(k, v));
    const qs = params.toString();
    navigate(`${ROUTES.explore}${qs ? `?${qs}` : ''}`, { replace: true });
  };

  return (
    <div className="page">
      <div className="container">
        <header className="page-header">
          <h1>Explorar gimnasios</h1>
          <p className="lead">Busca entre los gimnasios afiliados a Rutine por estado, ciudad o nombre.</p>
        </header>

        <GymSearchForm key={key} initial={filters} onSearch={onSearch} compact />

        <div className="results" aria-live="polite" aria-busy={state.status === 'loading'}>
          {state.status === 'loading' && (
            <div className="results-loading">
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}
              <span className="visually-hidden">Buscando gimnasios…</span>
            </div>
          )}

          {state.status === 'error' && (
            <div className="empty">
              <Icon name="info" size={28} />
              <h2>No se pudo completar la búsqueda</h2>
              <p>Revisa tu conexión y vuelve a intentarlo.</p>
            </div>
          )}

          {state.status === 'done' && state.items.length > 0 && (
            <ul className="gym-list">
              {state.items.map((gym) => (
                <li key={gym.id} className="gym-card">
                  <h2><Link to={buildPath(ROUTES.gymProfile, { slug: gym.slug })} className="card-link">{gym.trade_name}</Link></h2>
                  <p><Icon name="pin" size={16} /> {gym.city}, {gym.state}</p>
                  {gym.description ? <p className="gym-card-desc">{gym.description}</p> : null}
                  <span className="trainer-tile-cta" aria-hidden="true">Ver gimnasio</span>
                </li>
              ))}
            </ul>
          )}

          {state.status === 'done' && state.items.length === 0 && (
            <div className="empty">
              <span className="empty-icon"><Icon name="pin" size={28} /></span>
              <h2>Todavía no hay gimnasios publicados en {where}</h2>
              <p>
                {state.connected
                  ? 'Prueba con otra ciudad o quita el filtro de nombre.'
                  : 'Rutine está incorporando sus primeros gimnasios afiliados. Cuando se publiquen, aparecerán aquí.'}
              </p>
              <div className="hero-actions hero-actions--center">
                <Link to={ROUTES.affiliation} className="btn btn--primary">Afiliar mi gimnasio</Link>
                <Link to={ROUTES.home} className="btn btn--ghost">Volver al inicio</Link>
              </div>
            </div>
          )}

          {state.status === 'done' && state.demoExample && (
            <section className="demo-example" aria-labelledby="demo-example-t">
              <h2 id="demo-example-t">Así se verá un gimnasio afiliado</h2>
              <p className="muted">Mientras se publican los primeros gimnasios, puedes recorrer un perfil de demostración.</p>
              <ul className="gym-list">
                <li className="gym-card gym-card--demo gym-card--photo">
                  {state.demoExample.photos[0] && (
                    <img className="gym-card-img" src={mediaUrl(state.demoExample.photos[0].storage_path)} alt="" width="600" height="400" loading="lazy" />
                  )}
                  <span className="demo-badge"><Icon name="info" size={14} />Ejemplo, no es un gimnasio real</span>
                  <h3><Link to={buildPath(ROUTES.gymProfile, { slug: state.demoExample.slug })} className="card-link">{state.demoExample.trade_name}</Link></h3>
                  <p><Icon name="pin" size={16} /> {state.demoExample.locations[0].city}, {state.demoExample.locations[0].state} · {state.demoExample.locations.length} sedes</p>
                  {user ? (
                    <>
                      <Stars rating={state.demoExample.rating} size="sm" />
                      {(() => {
                        const p = cheapestMembership(state.demoExample.plans);
                        return p ? <p className="card-price"><strong>{formatPrice(p.price_amount, p.currency)}</strong> {priceSuffix(p)}</p> : null;
                      })()}
                    </>
                  ) : (
                    <p className="gym-card-desc"><Icon name="lock" size={14} /> Inicia sesión para ver precio y calificación.</p>
                  )}
                  <span className="trainer-tile-cta" aria-hidden="true">Ver perfil de ejemplo</span>
                </li>
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
