/**
 * Decide a qué espacio va una persona tras iniciar sesión.
 * Los datos vienen de la función my_workspaces del servidor.
 * Ocultar un botón no da seguridad: el servidor vuelve a comprobar cada acción.
 */
export function defaultDestination(workspaces) {
  if (!workspaces) return '/';
  const manageable = (workspaces.gyms || []).filter((g) => ['owner', 'manager'].includes(g.role));
  if (manageable.length === 1) return `/panel/${manageable[0].gym_id}/entrenadores`;
  if ((workspaces.gyms || []).length > 0) return '/panel';
  return '/gimnasios';
}

export function canManageGym(workspaces, gymId) {
  return Boolean((workspaces?.gyms || []).find((g) => g.gym_id === gymId && ['owner', 'manager'].includes(g.role)));
}

/** Solo acepta rutas internas para evitar redirecciones abiertas (?volver=https://…). */
export function safeReturnPath(value) {
  if (typeof value !== 'string') return null;
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : null;
}
