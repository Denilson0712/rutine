import { useState } from 'react';
import TrainerAvatar from './TrainerAvatar.jsx';
import { Link, buildPath, ROUTES } from '../../lib/router.jsx';
import Icon from '../ui/Icon.jsx';

const INITIAL = 6;

/** «Nuestros entrenadores»: solo los entrenadores públicos de ESTE gimnasio. */
export default function GymTrainers({ gym, trainers }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? trainers : trainers.slice(0, INITIAL);
  const locName = (id) => gym.locations.find((l) => l.id === id)?.name;

  if (trainers.length === 0) {
    return (
      <div className="empty empty--inline">
        <span className="empty-icon"><Icon name="trainer" size={26} /></span>
        <h3>Este gimnasio todavía no ha publicado a su equipo</h3>
        <p>Cuando registre a sus entrenadores, aparecerán aquí con su especialidad y horarios.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="trainer-grid">
        {visible.map((t) => {
          const href = buildPath(ROUTES.trainerProfile, { slug: gym.slug, trainer: t.slug });
          const verified = t.certifications.filter((c) => c.verified_at).length;
          return (
            <li key={t.id} className="trainer-tile">
              <TrainerAvatar trainer={t} />
              <div className="trainer-tile-body">
                <h3>
                  <Link to={href} className="trainer-tile-link">{t.full_name}</Link>
                </h3>
                {t.headline ? <p className="trainer-tile-headline">{t.headline}</p> : null}
                {t.specialties.length > 0 && (
                  <ul className="tags" aria-label="Especialidades">
                    {t.specialties.slice(0, 3).map((s) => <li key={s}>{s}</li>)}
                    {t.specialties.length > 3 ? <li>+{t.specialties.length - 3}</li> : null}
                  </ul>
                )}
                <dl className="trainer-tile-meta">
                  {t.experience_years != null && (
                    <div><dt>Experiencia</dt><dd>{t.experience_years} {t.experience_years === 1 ? 'año' : 'años'}</dd></div>
                  )}
                  {t.location_ids.length > 0 && (
                    <div><dt>Sede</dt><dd>{t.location_ids.map(locName).filter(Boolean).join(', ')}</dd></div>
                  )}
                  {verified > 0 && (
                    <div><dt>Certificaciones</dt><dd>{verified} verificada{verified > 1 ? 's' : ''} por el gimnasio</dd></div>
                  )}
                </dl>
                <span className="trainer-tile-cta" aria-hidden="true">Ver perfil</span>
              </div>
            </li>
          );
        })}
      </ul>
      {trainers.length > INITIAL && (
        <div className="center-row">
          <button type="button" className="btn btn--ghost" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
            {showAll ? 'Ver menos' : `Ver todos (${trainers.length})`}
          </button>
        </div>
      )}
    </>
  );
}
