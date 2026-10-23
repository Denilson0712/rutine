import { useState } from 'react';
import { mediaUrl } from '../../lib/supabase.js';
import { initials } from '../../lib/gymFormat.js';

/** Foto del entrenador o, si no hay, sus iniciales. Nunca una foto genérica. */
export default function TrainerAvatar({ trainer, size = 'md' }) {
  const [failed, setFailed] = useState(false);
  const src = mediaUrl(trainer.photo_path);
  return (
    <div className={`t-avatar t-avatar--${size}`}>
      {src && !failed ? (
        <img src={src} alt={`Foto de ${trainer.full_name}`} loading="lazy" decoding="async" width="320" height="400" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{initials(trainer.full_name)}</span>
      )}
    </div>
  );
}
