import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { mediaUrl } from '../../lib/supabase.js';

/** Galería: foto grande + miniaturas. Teclado: flechas izquierda/derecha. */
export default function GymGallery({ photos, isDemo }) {
  const [index, setIndex] = useState(0);
  if (!photos.length) {
    return (
      <div className="gym-cover gym-cover--art">
        <div className="track-art" aria-hidden="true" />
        <span className="cover-note">Este gimnasio aún no ha publicado fotos</span>
      </div>
    );
  }
  const current = photos[index];
  const go = (d) => setIndex((i) => (i + d + photos.length) % photos.length);

  return (
    <div className="gallery" role="region" aria-roledescription="galería" aria-label="Fotos del gimnasio"
      onKeyDown={(e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); }}>
      <div className="gallery-main">
        <img src={mediaUrl(current.storage_path)} alt={current.alt_text} width="1200" height="800" decoding="async" />
        {photos.length > 1 && (
          <>
            <button type="button" className="gallery-arrow gallery-arrow--prev" onClick={() => go(-1)} aria-label="Foto anterior"><Icon name="back" size={22} /></button>
            <button type="button" className="gallery-arrow gallery-arrow--next" onClick={() => go(1)} aria-label="Foto siguiente"><Icon name="back" size={22} /></button>
          </>
        )}
        <span className="gallery-count" aria-live="polite">{index + 1} / {photos.length}</span>
        {isDemo && <span className="cover-note">Imágenes de ejemplo</span>}
      </div>
      {photos.length > 1 && (
        <ul className="gallery-thumbs">
          {photos.map((p, i) => (
            <li key={p.id}>
              <button type="button" className={i === index ? 'is-active' : ''} aria-current={i === index} aria-label={`Ver foto ${i + 1}: ${p.alt_text}`} onClick={() => setIndex(i)}>
                <img src={mediaUrl(p.storage_path)} alt="" width="160" height="107" loading="lazy" decoding="async" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
