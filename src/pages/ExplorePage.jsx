import { useEffect, useState } from 'react';
import GymSearchForm from '../components/landing/GymSearchForm.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Link, navigate, useLocation, ROUTES } from '../lib/router.jsx';
import { searchGyms } from '../services/gyms.js';

export default function ExplorePage() {
  const { searchParams } = useLocation();
  const filters = {
    estado: searchParams.get('estado') ?? '',
    ciudad: searchParams.get('ciudad') ?? '',
    nombre: searchParams.get('nombre') ?? '',
  };
  const key = `${filters.estado}|${filters.ciudad}|${filters.nombre}`;
  const [state, setState] = useState({ status: 'loading', items: [], connected: false });

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, status: 'loading' }));
    searchGyms(filters)
      .then((res) => active && setState({ status: 'done', items: res.items, connected: res.connected }))
      .catch(() => active && setState({ status: 'error', items: [], connected: false }));
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
                  <h2>{gym.name}</h2>
                  <p><Icon name="pin" size={16} /> {gym.city}, {gym.state}</p>
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
        </div>
      </div>
    </div>
  );
}
