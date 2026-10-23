import { getSupabase, backendConfigured, friendlyError } from '../lib/supabase.js';

/**
 * Autenticación con Supabase Auth.
 * Sin backend configurado, todas las funciones responden { ok: false, reason: 'not_connected' }
 * y la interfaz lo explica: nunca se simula un inicio de sesión.
 *
 * Los roles NO se envían desde aquí: el servidor asigna "athlete" al registrarse
 * y el resto solo se obtiene creando un gimnasio o aceptando una invitación.
 */
const NOT_CONNECTED = { ok: false, reason: 'not_connected' };

function authError(error) {
  const msg = error?.message || '';
  if (/Invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
  if (/Email not confirmed/i.test(msg)) return 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.';
  if (/already registered|already exists/i.test(msg)) return 'Ya existe una cuenta con ese correo.';
  if (/rate limit|too many/i.test(msg)) return 'Demasiados intentos. Espera unos minutos.';
  if (/Password should be/i.test(msg)) return 'La contraseña no cumple los requisitos de seguridad.';
  return friendlyError(error);
}

export async function signIn({ email, password }) {
  if (!backendConfigured) return NOT_CONNECTED;
  const sb = await getSupabase();
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  return error ? { ok: false, reason: 'error', message: authError(error) } : { ok: true };
}

export async function signUp({ name, email, password }) {
  if (!backendConfigured) return NOT_CONNECTED;
  const sb = await getSupabase();
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/acceso` },
  });
  if (error) return { ok: false, reason: 'error', message: authError(error) };
  // Si el proyecto exige confirmar el correo, no hay sesión todavía.
  return { ok: true, needsConfirmation: !data.session };
}

export async function signOut() {
  if (!backendConfigured) return NOT_CONNECTED;
  const sb = await getSupabase();
  await sb.auth.signOut();
  return { ok: true };
}

export async function requestPasswordReset(email) {
  if (!backendConfigured) return NOT_CONNECTED;
  const sb = await getSupabase();
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/restablecer`,
  });
  // Por privacidad se responde igual exista o no la cuenta.
  return error && /rate limit/i.test(error.message) ? { ok: false, reason: 'error', message: authError(error) } : { ok: true };
}

export async function updatePassword(password) {
  if (!backendConfigured) return NOT_CONNECTED;
  const sb = await getSupabase();
  const { error } = await sb.auth.updateUser({ password });
  return error ? { ok: false, reason: 'error', message: authError(error) } : { ok: true };
}

/** Sesión actual + espacios autorizados (consultados al servidor, no deducidos en el cliente). */
export async function loadSession() {
  if (!backendConfigured) return { user: null, workspaces: null };
  const sb = await getSupabase();
  const { data } = await sb.auth.getSession();
  const user = data.session?.user ?? null;
  if (!user) return { user: null, workspaces: null };
  const { data: ws } = await sb.rpc('my_workspaces');
  return { user: { id: user.id, email: user.email }, workspaces: ws ?? { platform_roles: [], gyms: [] } };
}

export async function onAuthChange(callback) {
  if (!backendConfigured) return () => {};
  const sb = await getSupabase();
  const { data } = sb.auth.onAuthStateChange((event) => callback(event));
  return () => data.subscription.unsubscribe();
}
