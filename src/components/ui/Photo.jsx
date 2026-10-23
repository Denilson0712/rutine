import { useState } from 'react';

/**
 * Fotografía con respaldo gráfico.
 * Si no hay `src` (o la imagen falla), muestra un fondo de líneas de pista
 * en lugar de un icono de imagen rota.
 */
export default function Photo({ image, className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  const showImage = image?.src && !failed;

  return (
    <div className={`photo ${showImage ? '' : 'photo--art'} ${className}`}>
      {showImage ? (
        <img
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={eager ? 'high' : 'auto'}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="track-art" aria-hidden="true" />
      )}
    </div>
  );
}
