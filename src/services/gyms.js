/**
 * Búsqueda de gimnasios.
 *
 * PUNTO DE INTEGRACIÓN CON BACKEND
 * Todavía no existe una base de datos de gimnasios afiliados, así que esta
 * función devuelve una lista vacía y `connected: false`. La interfaz usa ese
 * valor para mostrar un estado vacío honesto en vez de resultados inventados.
 *
 * Para conectarla, reemplaza el cuerpo por la llamada real, por ejemplo:
 *   const res = await fetch(`/api/gyms?${new URLSearchParams(filters)}`);
 *   return { items: await res.json(), connected: true };
 *
 * Forma esperada de cada gimnasio:
 *   { id, name, state, city, address, services: [], photoUrl, slug }
 */
export async function searchGyms(filters) {
  void filters;
  return { items: [], connected: false };
}
