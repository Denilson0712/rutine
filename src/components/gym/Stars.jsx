import { ratingSummary } from '../../lib/gymFormat.js';

/**
 * Calificación con estrellas. Solo dibuja estrellas si hay reseñas;
 * sin reseñas muestra «Nuevo en Rutine».
 */
export default function Stars({ rating, size = 'md' }) {
  const r = ratingSummary(rating);
  if (!r.hasReviews) {
    return <p className={`stars stars--${size} stars--new`}><span className="new-badge">Nuevo en Rutine</span><span className="stars-text">Aún sin reseñas</span></p>;
  }
  const pct = Math.max(0, Math.min(100, (r.average / 5) * 100));
  return (
    <p className={`stars stars--${size}`}>
      <span className="stars-track" role="img" aria-label={`${r.average.toLocaleString('es-VE')} de 5 estrellas`}>
        <span className="stars-bg" aria-hidden="true">★★★★★</span>
        <span className="stars-fill" aria-hidden="true" style={{ width: `${pct}%` }}>★★★★★</span>
      </span>
      <strong>{r.average.toLocaleString('es-VE')}</strong>
      <span className="stars-text">({rating.count} {rating.count === 1 ? 'reseña' : 'reseñas'}{rating.isExample ? ' de ejemplo' : ''})</span>
    </p>
  );
}
