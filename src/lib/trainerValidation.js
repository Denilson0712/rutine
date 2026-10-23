/**
 * Validación del formulario de entrenador (cliente).
 * Las mismas reglas están en la base de datos (checks y triggers): esto solo
 * da mensajes inmediatos y comprensibles.
 */
export const MAX_SPECIALTIES = 12;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function emptyTrainer() {
  return {
    full_name: '',
    headline: '',
    bio: '',
    specialties: [],
    experience_years: '',
    is_public: false,
    status: 'active',
    location_ids: [],
    availability: [],
    certifications: [],
    photo_path: null,
  };
}

function overlaps(a, b) {
  return a.weekday === b.weekday && a.location_id === b.location_id && a.starts_at < b.ends_at && b.starts_at < a.ends_at;
}

export function validateTrainer(t) {
  const e = {};
  const name = (t.full_name || '').trim();
  if (name.length < 3 || name.length > 100) e.full_name = 'Escribe el nombre completo (3 a 100 caracteres).';
  if ((t.headline || '').length > 120) e.headline = 'Máximo 120 caracteres.';
  if ((t.bio || '').length > 1500) e.bio = 'Máximo 1.500 caracteres.';
  if (t.specialties.length > MAX_SPECIALTIES) e.specialties = `Máximo ${MAX_SPECIALTIES} especialidades.`;
  if (t.experience_years !== '' && t.experience_years != null) {
    const y = Number(t.experience_years);
    if (!Number.isInteger(y) || y < 0 || y > 60) e.experience_years = 'Indica un número de años entre 0 y 60.';
  }
  if (t.is_public && t.status !== 'active') e.is_public = 'Un perfil inactivo no puede ser público.';

  const slotErrors = [];
  t.availability.forEach((s, i) => {
    if (!s.location_id || !t.location_ids.includes(s.location_id)) slotErrors[i] = 'Elige una sede asignada al entrenador.';
    else if (!s.starts_at || !s.ends_at || s.ends_at <= s.starts_at) slotErrors[i] = 'La hora de fin debe ser posterior a la de inicio.';
    else if (t.availability.some((o, j) => j < i && overlaps(o, s))) slotErrors[i] = 'Se solapa con otra franja del mismo día y sede.';
  });
  if (slotErrors.some(Boolean)) e.availability = slotErrors;

  const certErrors = [];
  t.certifications.forEach((c, i) => {
    const y = c.year === '' || c.year == null ? null : Number(c.year);
    if ((c.name || '').trim().length < 2) certErrors[i] = 'Escribe el nombre de la certificación.';
    else if (y != null && (!Number.isInteger(y) || y < 1950 || y > 2100)) certErrors[i] = 'Año no válido.';
  });
  if (certErrors.some(Boolean)) e.certifications = certErrors;

  return e;
}

export function validatePhoto(file) {
  if (!file) return null;
  if (!PHOTO_TYPES.includes(file.type)) return 'Usa una imagen JPG, PNG o WebP.';
  if (file.size > MAX_PHOTO_BYTES) return 'La imagen debe pesar menos de 5 MB.';
  return null;
}

/** Normaliza una especialidad escrita a mano. */
export function normalizeSpecialty(text) {
  const t = (text || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1, 40);
}
