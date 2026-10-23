import { getSupabase, backendConfigured, friendlyError } from '../lib/supabase.js';
import { getDemoGym } from './demoStore.js';

const hhmm = (t) => (t ? t.slice(0, 5) : t);

// Lo que puede ver cualquier visitante.
const BASIC_SELECT = `
  id, slug, trade_name, description, amenities, services, affiliation_status,
  public_phone, public_email, public_whatsapp, instagram,
  locations:gym_locations(id, name, state, city, address, latitude, longitude, is_primary,
    hours:gym_opening_hours(weekday, opens_at, closes_at)),
  photos:gym_photos(id, storage_path, alt_text, sort_order)`;

// Con sesión iniciada: precios y entrenadores (la base de datos
// rechaza estas tablas a usuarios anónimos; ver migración 0800).
const PROFILE_SELECT = `
  id, slug, trade_name, description, amenities, services, affiliation_status,
  public_phone, public_email, public_whatsapp, instagram,
  locations:gym_locations(id, name, state, city, address, latitude, longitude, is_primary,
    hours:gym_opening_hours(weekday, opens_at, closes_at)),
  photos:gym_photos(id, storage_path, alt_text, sort_order),
  plans:membership_plans(id, name, kind, price_amount, currency, duration_days, description, sort_order, is_public, is_active),
  trainers(id, slug, full_name, headline, bio, specialties, experience_years, photo_path, is_public, status,
    trainer_locations(location_id),
    availability:trainer_availability(location_id, weekday, starts_at, ends_at),
    certifications:trainer_certifications(id, name, issuer, year, verified_at))
`;

/** Normaliza lo que llega de la base de datos a la forma que usa la interfaz. */
export function normalizeGym(raw) {
  return {
    ...raw,
    isDemo: false,
    membersDetails: Boolean(raw.membersDetails),
    // Las reseñas verificadas llegan en la fase 4: hasta entonces no hay calificación.
    rating: { average: null, count: 0 },
    classes: [],
    photos: [...(raw.photos || [])].sort((a, b) => a.sort_order - b.sort_order),
    locations: [...(raw.locations || [])]
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
      .map((l) => ({ ...l, hours: (l.hours || []).map((h) => ({ ...h, opens_at: hhmm(h.opens_at), closes_at: hhmm(h.closes_at) })) })),
    // El perfil público solo muestra planes publicados y activos.
    plans: (raw.plans || []).filter((p) => p.is_public && p.is_active),
    trainers: (raw.trainers || []).map((t) => ({
      ...t,
      location_ids: (t.trainer_locations || []).map((x) => x.location_id),
      availability: (t.availability || []).map((a) => ({ ...a, starts_at: hhmm(a.starts_at), ends_at: hhmm(a.ends_at) })),
      certifications: t.certifications || [],
    })),
  };
}

/** Entrenadores que se pueden mostrar en el perfil público de su gimnasio. */
export function publicTrainers(gym) {
  return (gym?.trainers || [])
    .filter((t) => t.is_public && t.status === 'active')
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'es'));
}

/**
 * Perfil público de un gimnasio por su slug.
 * Devuelve el gimnasio o null si no existe / no está publicado.
 */
export async function getGymProfile(slug, { signedIn = false } = {}) {
  if (!backendConfigured) {
    const demo = getDemoGym();
    if (slug !== demo.slug) return null;
    const copy = structuredClone(demo);
    copy.membersDetails = signedIn;
    // Igual que el servidor: sin sesión no se entregan precios ni entrenadores.
    if (!signedIn) { copy.plans = []; copy.trainers = []; }
    return copy;
  }
  const sb = await getSupabase();
  const { data: sess } = await sb.auth.getSession();
  const withDetails = signedIn && Boolean(sess.session);
  const { data, error } = await sb
    .from('gyms')
    .select(withDetails ? PROFILE_SELECT : BASIC_SELECT)
    .eq('slug', slug)
    .eq('affiliation_status', 'approved')
    .maybeSingle();
  if (error) throw new Error(friendlyError(error));
  return data ? normalizeGym({ ...data, membersDetails: withDetails }) : null;
}

/**
 * Perfil de un entrenador DENTRO de su gimnasio (nunca de un directorio global).
 * Devuelve { gym, trainer } o null.
 */
export async function getTrainerProfile(gymSlug, trainerSlug) {
  const gym = await getGymProfile(gymSlug, { signedIn: true });
  if (!gym) return null;
  const trainer = publicTrainers(gym).find((t) => t.slug === trainerSlug);
  return trainer ? { gym, trainer } : null;
}
