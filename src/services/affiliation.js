/**
 * Envío de solicitudes de afiliación.
 *
 * PUNTO DE INTEGRACIÓN CON BACKEND
 * Aún no hay un servidor que reciba las solicitudes. La función responde
 * `{ ok: false, reason: 'not_connected' }` y el formulario lo comunica
 * claramente: la solicitud NO se envía y los datos siguen en pantalla.
 *
 * Para conectarla:
 *   const res = await fetch('/api/affiliations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
 *   if (!res.ok) return { ok: false, reason: 'server_error' };
 *   return { ok: true };
 */
export async function submitAffiliation(data) {
  void data;
  return { ok: false, reason: 'not_connected' };
}
