import { useEffect, useState } from 'react';
import Icon from '../components/ui/Icon.jsx';
import DemoNotice from '../components/ui/DemoNotice.jsx';
import GymTrainers from '../components/gym/GymTrainers.jsx';
import { RatingLine, PlansBlock, HoursBlock, MapBlock, ContactActions } from '../components/gym/GymBlocks.jsx';
import { Link, ROUTES, scrollToSection } from '../lib/router.jsx';
import { mediaUrl } from '../lib/supabase.js';
import { formatPrice, priceSuffix, groupPlans } from '../lib/gymFormat.js';
import { getGymProfile, publicTrainers } from '../services/gymProfile.js';

const SECTIONS = [
  { id: 'informacion', label: 'Información' },
  { id: 'planes', label: 'Planes y precios' },
  { id: 'horarios', label: 'Horarios' },
  { id: 'entrenadores', label: 'Entrenadores' },
  { id: 'clases', label: 'Clases' },
  { id: 'ubicacion', label: 'Ubicación' },
];

export function useAsync(fn, deps) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  useEffect(() => {
    let active = true;
    setState({ status: 'loading', data: null, error: null });
    fn()
      .then((data) => active && setState({ status: 'done', data, error: null }))
      .catch((error) => active && setState({ status: 'error', data: null, error }));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function ProfileSkeleton() {
  return (
    <div className="page" aria-busy="true">
      <div className="container">
        <div className="skeleton" style={{ height: 300 }} />
        <div className="skeleton" style={{ height: 32, width: '50%', marginTop: 24 }} />
        <div className="skeleton" style={{ height: 160, marginTop: 24 }} />
        <span className="visually-hidden">Cargando perfil…</span>
      </div>
    </div>
  );
}

export function ProfileMissing({ title, text }) {
  return (
    <div className="page">
      <div className="container empty empty--page">
        <span className="empty-icon"><Icon name="pin" size={28} /></span>
        <h1>{title}</h1>
        <p>{text}</p>
        <div className="hero-actions hero-actions--center">
          <Link to={ROUTES.explore} className="btn btn--primary">Explorar gimnasios</Link>
        </div>
      </div>
    </div>
  );
}

function Cover({ gym }) {
  const photos = gym.photos.slice(0, 5);
  if (photos.length === 0) {
    return (
      <div className="gym-cover gym-cover--art">
        <div className="track-art" aria-hidden="true" />
        {gym.isDemo ? <span className="cover-note">Sin fotografías: perfil de demostración</span> : null}
      </div>
    );
  }
  return (
    <div className={`gym-cover gym-cover--${Math.min(photos.length, 3)}`}>
      {photos.slice(0, 3).map((p, i) => (
        <img key={p.id} src={mediaUrl(p.storage_path)} alt={p.alt_text} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" width="1200" height="800" />
      ))}
    </div>
  );
}

export default function GymProfilePage({ params }) {
  const { status, data: gym, error } = useAsync(() => getGymProfile(params.slug), [params.slug]);

  useEffect(() => {
    if (gym) document.title = `${gym.trade_name} · Rutine`;
  }, [gym]);

  if (status === 'loading') return <ProfileSkeleton />;
  if (status === 'error') return <ProfileMissing title="No se pudo cargar el gimnasio" text={error.message || 'Revisa tu conexión e inténtalo de nuevo.'} />;
  if (!gym) return <ProfileMissing title="Gimnasio no encontrado" text="Puede que el enlace sea incorrecto o que el gimnasio ya no esté publicado en Rutine." />;

  const trainers = publicTrainers(gym);
  const primary = gym.locations[0];
  const memberships = groupPlans(gym.plans).memberships;
  const from = memberships.length ? memberships.reduce((a, b) => (Number(a.price_amount) <= Number(b.price_amount) ? a : b)) : null;

  return (
    <div className="gym-profile">
      <div className="container">
        {gym.isDemo && (
          <DemoNotice>
            <strong>Perfil de demostración.</strong> Este gimnasio, sus precios y sus entrenadores no existen: sirven para mostrar cómo se verá un gimnasio afiliado.
          </DemoNotice>
        )}

        <Link to={ROUTES.explore} className="back-link"><Icon name="back" size={18} /> Volver a la búsqueda</Link>

        <Cover gym={gym} />

        <header className="gym-header">
          <div>
            <h1>{gym.trade_name}</h1>
            {primary && (
              <p className="gym-location">
                <Icon name="pin" size={18} />
                {primary.city}, {primary.state}
                {gym.locations.length > 1 ? ` · ${gym.locations.length} sedes` : ''}
              </p>
            )}
            <RatingLine rating={gym.rating} />
          </div>
          {from && (
            <p className="gym-from">
              <span>Membresías desde</span>
              <strong>{formatPrice(from.price_amount, from.currency)}</strong>
              <small>{priceSuffix(from)}</small>
            </p>
          )}
        </header>

        <nav className="profile-nav" aria-label="Secciones del gimnasio">
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(s.id); }}>
                  {s.label}
                  {s.id === 'entrenadores' && trainers.length > 0 ? <span className="count">{trainers.length}</span> : null}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="profile-layout">
          <div className="profile-main">
            <section id="informacion" className="profile-section" aria-labelledby="informacion-t">
              <h2 id="informacion-t">Sobre el gimnasio</h2>
              {gym.description ? <p className="lead">{gym.description}</p> : <p className="muted">Sin descripción publicada.</p>}
              <div className="facts">
                {gym.amenities.length > 0 && (
                  <div>
                    <h3>Instalaciones</h3>
                    <ul className="checklist">{gym.amenities.map((a) => <li key={a}><Icon name="check" size={18} />{a}</li>)}</ul>
                  </div>
                )}
                {gym.services.length > 0 && (
                  <div>
                    <h3>Servicios</h3>
                    <ul className="checklist">{gym.services.map((a) => <li key={a}><Icon name="check" size={18} />{a}</li>)}</ul>
                  </div>
                )}
              </div>
            </section>

            <section id="planes" className="profile-section" aria-labelledby="planes-t">
              <h2 id="planes-t">Planes y precios</h2>
              <PlansBlock plans={gym.plans} />
            </section>

            <section id="horarios" className="profile-section" aria-labelledby="horarios-t">
              <h2 id="horarios-t">Horarios de atención</h2>
              <HoursBlock locations={gym.locations} />
            </section>

            <section id="entrenadores" className="profile-section" aria-labelledby="entrenadores-t">
              <div className="section-row">
                <h2 id="entrenadores-t">Nuestros entrenadores</h2>
                {gym.isDemo && <span className="demo-badge"><Icon name="info" size={14} />Perfiles de ejemplo</span>}
              </div>
              <GymTrainers gym={gym} trainers={trainers} />
            </section>

            <section id="clases" className="profile-section" aria-labelledby="clases-t">
              <h2 id="clases-t">Clases disponibles</h2>
              <div className="empty empty--inline">
                <span className="empty-icon"><Icon name="calendar" size={26} /></span>
                <h3>Aún no hay clases publicadas</h3>
                <p>Cuando el gimnasio active su calendario, verás aquí las clases, sus horarios y los cupos disponibles.</p>
              </div>
            </section>

            <section id="resenas" className="profile-section" aria-labelledby="resenas-t">
              <h2 id="resenas-t">Reseñas</h2>
              <p className="muted">Este gimnasio aún no tiene reseñas. Solo podrán opinar atletas que hayan entrenado en él.</p>
            </section>

            <section id="ubicacion" className="profile-section" aria-labelledby="ubicacion-t">
              <h2 id="ubicacion-t">Ubicación</h2>
              <MapBlock location={primary} />
              {gym.locations.length > 1 && (
                <ul className="other-locations">
                  {gym.locations.slice(1).map((l) => (
                    <li key={l.id}><Icon name="pin" size={16} /> <strong>{l.name}</strong> · {[l.address, l.city].filter(Boolean).join(', ')}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="profile-aside" aria-label="Contacto">
            <div className="aside-card">
              <h2>¿Quieres entrenar aquí?</h2>
              <ContactActions gym={gym} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
