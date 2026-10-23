/**
 * Autenticación.
 *
 * PUNTO DE INTEGRACIÓN CON BACKEND
 * Todavía no existe un sistema de cuentas. Estas funciones devuelven
 * `not_connected` y la página de acceso lo muestra sin simular un inicio de sesión.
 * Reemplázalas por el proveedor que elijas (API propia, Supabase, Firebase, etc.).
 */
export async function signIn(credentials) {
  void credentials;
  return { ok: false, reason: 'not_connected' };
}

export async function signUp(account) {
  void account;
  return { ok: false, reason: 'not_connected' };
}
