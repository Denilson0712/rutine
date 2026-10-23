import { useEffect } from 'react';
import Icon from '../components/ui/Icon.jsx';
import DemoNotice from '../components/ui/DemoNotice.jsx';
import TrainerAvatar from '../components/gym/TrainerAvatar.jsx';
import { ContactActions } from '../components/gym/GymBlocks.jsx';
import { useAsync, ProfileSkeleton, ProfileMissing } from './GymProfilePage.jsx';
import { Link, buildPath, ROUTES } from '../lib/router.jsx';
import { groupByWeekday } from '../lib/gymFormat.js';
import { getTrainerProfile } from '../services/gymProfile.js';
import { business } from '../config/business.js';

export default function TrainerProfilePage({ params }) {
  const { status, data, error } = useAsync(() => getTrainerProfile(params.slug, params.trainer), [params.slug, params.trainer]);

  useEffect(() => {
    if (data) document.title = `${data.trainer.full_name} · ${data.gym.trade_name} · Rutine`;
  }, [data]);

  if (status === 'loading') return <ProfileSkeleton />;
  if (status === 'error') return <ProfileMissing title="No se pudo cargar el perfil" text={error.message || 'Inténtalo de nuevo.'} />;
  if (!data) return <ProfileMissing title="Entrenador no encontrado" text="Puede que el perfil ya no esté publicado por su gimnasio." />;

  const { gym, trainer } = data;
  const gymHref = buildPath(ROUTES.gymProfile, { slug: gym.slug });
  const locations = gym.locations.filter((l) => trainer.location_ids.includes(l.id));

  return (
    <div className="page trainer-page">
      <div className="container">
        {gym.isDemo && (
          <DemoNotice><strong>Perfil de demostración.</strong> Esta persona no existe: el perfil muestra cómo se verá un entrenador de un gimnasio afiliado.</DemoNotice>
        )}

        <nav aria-label="Ruta de navegación" className="breadcrumbs">
          <ol>
            <li><Link to={ROUTES.explore}>Gimnasios</Link></li>
            <li><Link to={gymHref}>{gym.trade_name}</Link></li>
            <li aria-current="page">{trainer.full_name}</li>
          </ol>
        </nav>

        <div className="trainer-layout">
          <div className="trainer-hero">
            <TrainerAvatar trainer={trainer} size="lg" />
            <div className="trainer-hero-body">
              <p className="trainer-gym-line">
                <Icon name="store" size={18} />
                Entrena en <Link to={gymHref}>{gym.trade_name}</Link>
              </p>
              <h1>{trainer.full_name}</h1>
              {trainer.headline ? <p className="lead">{trainer.headline}</p> : null}
              {trainer.specialties.length > 0 && (
                <ul className="tags tags--lg" aria-label="Especialidades">
                  {trainer.specialties.map((s) => <li key={s}>{s}</li>)}
                </ul>
              )}
              <p className="rating rating--empty"><Icon name="star" size={18} /><span>Aún no tiene reseñas</span></p>
            </div>
          </div>

          <div className="trainer-content">
            <section className="profile-section" aria-labelledby="bio-t">
              <h2 id="bio-t">Sobre {trainer.full_name.split(' ')[0]}</h2>
              {trainer.bio ? <p className="prose">{trainer.bio}</p> : <p className="muted">Sin biografía publicada.</p>}
              {trainer.experience_years != null && (
                <p className="stat-line"><strong>{trainer.experience_years}</strong> {trainer.experience_years === 1 ? 'año' : 'años'} de experiencia</p>
              )}
            </section>

            <section className="profile-section" aria-labelledby="cert-t">
              <h2 id="cert-t">Certificaciones</h2>
              {trainer.certifications.length === 0 ? (
                <p className="muted">No ha registrado certificaciones.</p>
              ) : (
                <ul className="cert-list">
                  {trainer.certifications.map((c) => (
                    <li key={c.id}>
                      <div>
                        <strong>{c.name}</strong>
                        <span>{[c.issuer, c.year].filter(Boolean).join(' · ')}</span>
                      </div>
                      {c.verified_at ? (
                        <span className="status status--paid" title="El gimnasio revisó el documento">Verificada por el gimnasio</span>
                      ) : (
                        <span className="status status--neutral">Sin verificar</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="profile-section" aria-labelledby="disp-t">
              <h2 id="disp-t">Disponibilidad</h2>
              {locations.length === 0 && trainer.availability.length === 0 ? (
                <p className="muted">Disponibilidad no publicada. Consulta al gimnasio.</p>
              ) : (
                <div className="hours-grid">
                  {locations.map((l) => {
                    const days = groupByWeekday(trainer.availability.filter((a) => a.location_id === l.id));
                    return (
                      <section key={l.id} className="hours-card" aria-label={`Disponibilidad en ${l.name}`}>
                        <h3>{l.name}</h3>
                        <p className="fine-print">{[l.address, l.city].filter(Boolean).join(', ')}</p>
                        {days.length === 0 ? (
                          <p className="muted">Sin horario publicado en esta sede.</p>
                        ) : (
                          <dl className="hours">
                            {days.map((d) => <div key={d.weekday}><dt>{d.label}</dt><dd>{d.ranges.join(', ')}</dd></div>)}
                          </dl>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="profile-section" aria-labelledby="clases-t">
              <h2 id="clases-t">Clases que imparte</h2>
              <p className="muted">El gimnasio aún no ha publicado clases asignadas a este entrenador.</p>
            </section>
          </div>

          <aside className="profile-aside" aria-label="Contacto">
            <div className="aside-card">
              <h2>Entrena con {trainer.full_name.split(' ')[0]}</h2>
              {business.features.trainerBooking ? (
                <button type="button" className="btn btn--primary btn--lg btn--block">Reservar una sesión</button>
              ) : (
                <p className="fine-print">Las reservas con entrenadores aún no están disponibles. Pregunta por su disponibilidad al gimnasio.</p>
              )}
              <ContactActions gym={gym} compact />
              <Link to={gymHref} className="btn btn--ghost btn--block">Ver el gimnasio</Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
