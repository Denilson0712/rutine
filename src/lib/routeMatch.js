/**
 * Coincidencia de rutas con parámetros, sin dependencias.
 * matchPath('/gimnasios/:slug', '/gimnasios/box-valencia') → { slug: 'box-valencia' }
 * Devuelve null si no coincide.
 */
export function matchPath(pattern, path) {
  const clean = (p) => (p.length > 1 ? p.replace(/\/+$/, '') : p);
  const pp = clean(pattern).split('/');
  const sp = clean(path).split('/');
  if (pp.length !== sp.length) return null;
  const params = {};
  for (let i = 0; i < pp.length; i += 1) {
    if (pp[i].startsWith(':')) {
      if (!sp[i]) return null;
      try {
        params[pp[i].slice(1)] = decodeURIComponent(sp[i]);
      } catch {
        return null;
      }
    } else if (pp[i] !== sp[i]) {
      return null;
    }
  }
  return params;
}

/** Recorre una tabla de rutas y devuelve la primera coincidencia. */
export function resolveRoute(routes, path) {
  for (const route of routes) {
    const params = matchPath(route.path, path);
    if (params) return { route, params };
  }
  return null;
}

/** Construye una ruta: buildPath('/gimnasios/:slug', { slug: 'x' }) → '/gimnasios/x' */
export function buildPath(pattern, params = {}) {
  return pattern.replace(/:([a-zA-Z]+)/g, (_, key) => encodeURIComponent(params[key] ?? ''));
}
