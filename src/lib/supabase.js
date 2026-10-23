/**
 * Cliente de Supabase, opcional.
 *
 * Se activa solo si existen VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver .env.example).
 * La clave "anon" es pública por diseño: la seguridad la imponen las políticas RLS
 * de supabase/migrations. NUNCA pongas aquí la clave service_role.
 *
 * Sin variables, la aplicación funciona en modo demostración y lo indica en pantalla.
 */
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const URL = env.VITE_SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

export const backendConfigured = Boolean(URL && ANON_KEY);

let clientPromise = null;

/** Devuelve el cliente (carga la librería solo cuando hace falta) o null en modo demostración. */
export function getSupabase() {
  if (!backendConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(URL, ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      }),
    );
  }
  return clientPromise;
}

/** Convierte un error de Supabase/PostgreSQL en un mensaje comprensible. */
export function friendlyError(error) {
  if (!error) return null;
  const msg = error.message || String(error);
  if (error.code === '42501' || /permission denied|row-level security/i.test(msg)) {
    return 'No tienes permiso para realizar esta acción.';
  }
  if (error.code === '23505') return 'Ese registro ya existe.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'No hay conexión con el servidor. Revisa tu internet.';
  // Los mensajes de las funciones SQL de Rutine ya están en español y son seguros de mostrar.
  if (['22023', 'P0002', '23514', '54000'].includes(error.code)) return msg;
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}

/** URL pública de una imagen del bucket gym-media. */
export function mediaUrl(path) {
  if (!path) return null;
  if (/^(blob:|data:|https?:)/.test(path)) return path;
  return backendConfigured ? `${URL}/storage/v1/object/public/gym-media/${path}` : null;
}
