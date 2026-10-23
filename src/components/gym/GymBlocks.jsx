import Icon from '../ui/Icon.jsx';
import { formatPrice, groupPlans, groupByWeekday, priceSuffix, ratingSummary } from '../../lib/gymFormat.js';
import { business } from '../../config/business.js';

/** Calificación: solo con reseñas reales. */
export function RatingLine({ rating }) {
  const r = ratingSummary(rating);
  return (
    <p className={`rating ${r.hasReviews ? '' : 'rating--empty'}`}>
      <Icon name="star" size={18} />
      <span>{r.text}</span>
    </p>
  );
}

function PlanList({ title, plans, note }) {
  if (plans.length === 0) return null;
  return (
    <div className="plan-group">
      <h3>{title}</h3>
      {note ? <p className="fine-print">{note}</p> : null}
      <ul className="plan-list">
        {plans.map((p) => (
          <li key={p.id} className="plan">
            <div>
              <strong>{p.name}</strong>
              {p.description ? <p>{p.description}</p> : null}
            </div>
            <div className="plan-price">
              <span>{formatPrice(p.price_amount, p.currency)}</span>
              <small>{priceSuffix(p)}</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PlansBlock({ plans }) {
  const g = groupPlans(plans);
  if (plans.length === 0) {
    return <p className="muted">Este gimnasio aún no ha publicado sus precios. Contáctalo para conocerlos.</p>;
  }
  return (
    <div className="plans">
      <PlanList title="Inscripción" plans={g.enrollment} note="Pago único al registrarte." />
      <PlanList title="Membresías" plans={g.memberships} />
      <PlanList title="Clases individuales" plans={g.single} />
    </div>
  );
}

export function HoursBlock({ locations }) {
  return (
    <div className="hours-grid">
      {locations.map((l) => {
        const days = groupByWeekday(l.hours, 'opens_at', 'closes_at');
        return (
          <section key={l.id} className="hours-card" aria-label={`Horario de ${l.name}`}>
            <h3>{l.name}</h3>
            {days.length === 0 ? (
              <p className="muted">Horario no publicado.</p>
            ) : (
              <dl className="hours">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const day = days.find((x) => x.weekday === d);
                  const label = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][d - 1];
                  return (
                    <div key={d}>
                      <dt>{label}</dt>
                      <dd className={day ? '' : 'muted'}>{day ? day.ranges.join(', ') : 'Cerrado'}</dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function MapBlock({ location }) {
  if (!location) return null;
  const hasCoords = location.latitude != null && location.longitude != null;
  const lat = Number(location.latitude);
  const lon = Number(location.longitude);
  const query = hasCoords ? `${lat},${lon}` : `${location.address || ''} ${location.city}, ${location.state}, Venezuela`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return (
    <div className="map-block">
      {hasCoords ? (
        <iframe
          title={`Mapa de ${location.name}`}
          className="map-frame"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.008},${lat - 0.005},${lon + 0.008},${lat + 0.005}&layer=mapnik&marker=${lat},${lon}`}
        />
      ) : (
        <div className="map-frame map-frame--empty"><Icon name="pin" size={28} /><p>Ubicación exacta no publicada</p></div>
      )}
      <div className="map-meta">
        <p><strong>{location.name}</strong><br />{[location.address, location.city, location.state].filter(Boolean).join(', ')}</p>
        <a className="btn btn--ghost btn--small" href={mapsHref} target="_blank" rel="noopener noreferrer">Cómo llegar</a>
      </div>
    </div>
  );
}

/** Acciones de contacto e inscripción. Solo muestra lo que existe de verdad. */
export function ContactActions({ gym, compact = false }) {
  const links = [];
  if (gym.public_whatsapp) links.push({ href: `https://wa.me/${gym.public_whatsapp.replace(/\D/g, '')}`, label: 'Escribir por WhatsApp', external: true });
  if (gym.public_phone) links.push({ href: `tel:${gym.public_phone}`, label: 'Llamar' });
  if (gym.public_email) links.push({ href: `mailto:${gym.public_email}`, label: 'Enviar correo' });
  if (gym.instagram) links.push({ href: `https://instagram.com/${gym.instagram}`, label: 'Instagram', external: true });

  return (
    <div className={`contact-actions ${compact ? 'contact-actions--compact' : ''}`}>
      {business.features.onlineEnrollment ? (
        <a className="btn btn--primary btn--lg" href="#planes">Inscribirme</a>
      ) : null}
      {links.map((l, i) => (
        <a key={l.href} href={l.href} className={`btn ${i === 0 && !business.features.onlineEnrollment ? 'btn--primary' : 'btn--ghost'}`}
          {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {l.label}
        </a>
      ))}
      {links.length === 0 && (
        <p className="muted">Este gimnasio aún no ha publicado datos de contacto.</p>
      )}
      {!business.features.onlineEnrollment && (
        <p className="fine-print">La inscripción en línea todavía no está disponible. Contacta al gimnasio para inscribirte.</p>
      )}
    </div>
  );
}
