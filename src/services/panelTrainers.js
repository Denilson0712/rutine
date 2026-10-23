import { getSupabase, backendConfigured, friendlyError } from '../lib/supabase.js';
import { getDemoGym, setDemoGym, resetDemoGym } from './demoStore.js';
import { normalizeGym } from './gymProfile.js';

/**
 * Módulo «Entrenadores» del panel.
 *
 * Con backend: lee y escribe en Supabase. La seguridad la imponen RLS y la
 * función save_trainer (comprueba que el usuario administra ESE gimnasio).
 *
 * Sin backend: modo demostración en memoria. Los cambios se pierden al recargar
 * y la interfaz lo dice en todo momento.
 */
export const panelIsDemo = !backendConfigured;

// ---------------------------------------------------------------------------
// Modo demostración (memoria)
// ---------------------------------------------------------------------------
let demoSeq = 100;
const demoDelay = () => new Promise((r) => setTimeout(r, 150));

export const resetDemoPanel = resetDemoGym;

// ---------------------------------------------------------------------------
// API común
// ---------------------------------------------------------------------------

/** Gimnasios que la persona puede administrar. */
export async function listManageableGyms() {
  if (panelIsDemo) {
    const demoState = getDemoGym();
    return [{ gym_id: demoState.id, trade_name: demoState.trade_name, role: 'owner', affiliation_status: 'approved', isDemo: true }];
  }
  const sb = await getSupabase();
  const { data, error } = await sb.rpc('my_workspaces');
  if (error) throw new Error(friendlyError(error));
  return (data?.gyms || []).filter((g) => ['owner', 'manager'].includes(g.role));
}

/** Gimnasio con sus sedes y entrenadores (todos, públicos o no). */
export async function getPanelGym(gymId) {
  if (panelIsDemo) {
    await demoDelay();
    if (gymId !== getDemoGym().id) return null;
    return structuredClone(getDemoGym());
  }
  const sb = await getSupabase();
  const { data, error } = await sb
    .from('gyms')
    .select(`id, slug, trade_name, affiliation_status,
      locations:gym_locations(id, name, state, city, address, latitude, longitude, is_primary, hours:gym_opening_hours(weekday, opens_at, closes_at)),
      trainers(id, slug, full_name, headline, bio, specialties, experience_years, photo_path, is_public, status,
        trainer_locations(location_id),
        availability:trainer_availability(location_id, weekday, starts_at, ends_at),
        certifications:trainer_certifications(id, name, issuer, year, verified_at))`)
    .eq('id', gymId)
    .maybeSingle();
  if (error) throw new Error(friendlyError(error));
  if (!data) return null;
  const gym = normalizeGym({ ...data, plans: [], photos: [] });
  gym.editable = ['draft', 'approved'].includes(data.affiliation_status);
  return gym;
}

function toPayload(form) {
  const payload = {
    full_name: form.full_name.trim(),
    headline: form.headline,
    bio: form.bio,
    specialties: form.specialties,
    experience_years: form.experience_years === '' ? '' : String(form.experience_years),
    is_public: form.is_public,
    status: form.status,
    location_ids: form.location_ids,
    availability: form.availability.map(({ location_id, weekday, starts_at, ends_at }) => ({
      location_id, weekday: Number(weekday), starts_at, ends_at,
    })),
    certifications: form.certifications.map((c) => ({
      id: c.id && !String(c.id).startsWith('new-') ? c.id : null,
      name: c.name.trim(), issuer: c.issuer || '', year: c.year === '' ? '' : String(c.year ?? ''), verified: Boolean(c.verified),
    })),
  };
  return payload;
}

/**
 * Crea o actualiza un entrenador. photo: { file } para subir, { remove: true } para quitarla.
 * Devuelve el id del entrenador.
 */
export async function saveTrainer(gymId, trainerId, form, photo) {
  if (panelIsDemo) {
    await demoDelay();
    const id = trainerId || `demo-t${(demoSeq += 1)}`;
    let photo_path = form.photo_path;
    if (photo?.file) photo_path = URL.createObjectURL(photo.file);
    if (photo?.remove) photo_path = null;
    const slugBase = form.full_name.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const demoState = getDemoGym();
    const existing = demoState.trainers.find((t) => t.id === id);
    const record = {
      ...(existing || {}),
      id,
      slug: existing?.slug || `${slugBase}-${demoSeq}`,
      full_name: form.full_name.trim(),
      headline: form.headline || null,
      bio: form.bio || null,
      specialties: form.specialties,
      experience_years: form.experience_years === '' ? null : Number(form.experience_years),
      is_public: form.is_public,
      status: form.status,
      photo_path,
      location_ids: [...form.location_ids],
      availability: form.availability.map((a) => ({ ...a, weekday: Number(a.weekday) })),
      certifications: form.certifications.map((c, i) => ({
        id: c.id && !String(c.id).startsWith('new-') ? c.id : `demo-c${demoSeq}-${i}`,
        name: c.name.trim(), issuer: c.issuer || null, year: c.year === '' ? null : Number(c.year),
        verified_at: c.verified ? (c.verified_at || new Date().toISOString()) : null,
      })),
    };
    setDemoGym({
      ...demoState,
      trainers: existing ? demoState.trainers.map((t) => (t.id === id ? record : t)) : [...demoState.trainers, record],
    });
    return id;
  }

  const sb = await getSupabase();
  let id = trainerId;
  let photoPath;

  // 1) Datos, sedes, horarios y certificaciones en una sola transacción.
  const first = await sb.rpc('save_trainer', { p_gym: gymId, p_trainer: id, p_data: toPayload(form) });
  if (first.error) throw new Error(friendlyError(first.error));
  id = first.data;

  // 2) Foto (el almacenamiento no participa en la transacción SQL).
  if (photo?.file) {
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[photo.file.type];
    const path = `${gymId}/trainers/${id}-${Date.now()}.${ext}`;
    const up = await sb.storage.from('gym-media').upload(path, photo.file, { contentType: photo.file.type, upsert: false });
    if (up.error) throw new Error('Los datos se guardaron, pero la foto no se pudo subir. Inténtalo de nuevo.');
    photoPath = path;
  } else if (photo?.remove) {
    photoPath = null;
  }
  if (photoPath !== undefined) {
    // RLS solo permite esta actualización a administradores del gimnasio.
    const second = await sb.from('trainers').update({ photo_path: photoPath }).eq('id', id).eq('gym_id', gymId);
    if (second.error) throw new Error(friendlyError(second.error));
    if (form.photo_path && form.photo_path !== photoPath) {
      // Limpieza de la foto anterior; si falla no afecta a los datos.
      await sb.storage.from('gym-media').remove([form.photo_path]).catch(() => {});
    }
  }
  return id;
}

/** Cambio rápido de visibilidad desde la lista. */
export async function setTrainerPublic(gymId, trainer, isPublic) {
  const form = {
    ...trainer,
    headline: trainer.headline || '',
    bio: trainer.bio || '',
    experience_years: trainer.experience_years ?? '',
    is_public: isPublic,
    certifications: trainer.certifications.map((c) => ({ ...c, verified: Boolean(c.verified_at) })),
  };
  return saveTrainer(gymId, trainer.id, form);
}
