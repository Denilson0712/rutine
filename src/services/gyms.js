import { getSupabase, backendConfigured, friendlyError } from '../lib/supabase.js';
import { DEMO_GYM } from '../data/demoGym.js';

/** Escapa comodines de LIKE para que el texto del usuario se busque literal. */
function likeSafe(text) {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Búsqueda de gimnasios aprobados.
 * - Con backend: consulta real (RLS solo devuelve gimnasios aprobados al público).
 * - Sin backend: lista vacía + el gimnasio de demostración como ejemplo aparte.
 *
 * Devuelve { items, connected, demoExample }
 */
export async function searchGyms({ estado = '', ciudad = '', nombre = '' } = {}) {
  if (!backendConfigured) {
    return { items: [], connected: false, demoExample: DEMO_GYM };
  }
  const sb = await getSupabase();
  let q = sb
    .from('gym_locations')
    .select('city, state, address, gym:gyms!inner(id, slug, trade_name, description, affiliation_status, amenities)')
    .eq('gym.affiliation_status', 'approved')
    .limit(60);
  if (estado) q = q.eq('state', estado);
  if (ciudad) q = q.eq('city', ciudad);
  if (nombre.trim()) q = q.ilike('gym.trade_name', `%${likeSafe(nombre.trim())}%`);

  const { data, error } = await q;
  if (error) throw new Error(friendlyError(error));

  // Un gimnasio con varias sedes en la ciudad aparece una sola vez.
  const byId = new Map();
  for (const row of data) {
    const g = row.gym;
    if (!byId.has(g.id)) byId.set(g.id, { ...g, city: row.city, state: row.state, locationsInArea: 0 });
    byId.get(g.id).locationsInArea += 1;
  }
  return { items: [...byId.values()], connected: true, demoExample: null };
}
