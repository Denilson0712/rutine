import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchPath, resolveRoute, buildPath } from '../src/lib/routeMatch.js';
import { groupPlans, formatPrice, groupByWeekday, ratingSummary, initials, formatTime } from '../src/lib/gymFormat.js';
import { validateTrainer, emptyTrainer, validatePhoto, normalizeSpecialty } from '../src/lib/trainerValidation.js';
import { defaultDestination, canManageGym, safeReturnPath } from '../src/lib/workspaces.js';

test('rutas: parámetros y coincidencia exacta', () => {
  assert.deepEqual(matchPath('/gimnasios/:slug', '/gimnasios/box-valencia'), { slug: 'box-valencia' });
  assert.deepEqual(matchPath('/gimnasios/:slug/entrenadores/:trainer', '/gimnasios/a/entrenadores/b'), { slug: 'a', trainer: 'b' });
  assert.equal(matchPath('/gimnasios/:slug', '/gimnasios'), null);
  assert.equal(matchPath('/gimnasios', '/gimnasios/x'), null);
  assert.deepEqual(matchPath('/gimnasios', '/gimnasios/'), {});
  assert.equal(matchPath('/a/:x', '/a/%E0%A4%A'), null, 'URL mal codificada no rompe');
  assert.equal(buildPath('/panel/:gymId/entrenadores', { gymId: 'a b' }), '/panel/a%20b/entrenadores');
});

test('rutas: las rutas públicas originales siguen resolviendo', () => {
  const table = ['/', '/gimnasios', '/gimnasios/:slug', '/afiliacion', '/acceso'].map((path) => ({ path }));
  for (const p of ['/', '/gimnasios', '/afiliacion', '/acceso']) assert.equal(resolveRoute(table, p).route.path, p);
  assert.equal(resolveRoute(table, '/no-existe'), null);
});

test('planes: cada precio queda en su grupo', () => {
  const g = groupPlans([
    { id: 1, kind: 'monthly', sort_order: 2 }, { id: 2, kind: 'enrollment' }, { id: 3, kind: 'single_class' }, { id: 4, kind: 'annual', sort_order: 1 },
  ]);
  assert.deepEqual(g.enrollment.map((p) => p.id), [2]);
  assert.deepEqual(g.memberships.map((p) => p.id), [4, 1]);
  assert.deepEqual(g.single.map((p) => p.id), [3]);
  assert.equal(formatPrice(30, 'USD'), 'US$ 30');
  assert.equal(formatPrice(30, 'RUN'), '30 RUN');
  assert.equal(formatPrice(12.5), '12,50 RUN', 'RUN es la moneda por defecto');
  assert.match(formatPrice(1250.5, 'VES'), /^Bs\. 1\.250,50$/);
});

test('horarios y reseñas', () => {
  const days = groupByWeekday([
    { weekday: 3, starts_at: '18:00', ends_at: '20:00' }, { weekday: 1, starts_at: '06:00', ends_at: '10:00' }, { weekday: 3, starts_at: '06:00', ends_at: '08:00' },
  ]);
  assert.deepEqual(days.map((d) => d.label), ['Lunes', 'Miércoles']);
  assert.equal(days[1].ranges[0], '6:00 a. m. – 8:00 a. m.');
  assert.equal(formatTime('12:30'), '12:30 p. m.');
  assert.equal(ratingSummary({ count: 0 }).hasReviews, false, 'sin reseñas no hay estrellas');
  assert.equal(ratingSummary({ average: 4.66, count: 3 }).text, '4,7 de 5 · 3 reseñas');
  assert.equal(initials('María José Pérez'), 'MJ');
});

test('validación del entrenador', () => {
  const base = { ...emptyTrainer(), full_name: 'Ana Torres', location_ids: ['L1'] };
  assert.deepEqual(validateTrainer(base), {});
  assert.ok(validateTrainer({ ...base, full_name: 'A' }).full_name);
  assert.ok(validateTrainer({ ...base, experience_years: '61' }).experience_years);
  assert.ok(validateTrainer({ ...base, is_public: true, status: 'inactive' }).is_public);
  const slots = [
    { location_id: 'L1', weekday: 1, starts_at: '06:00', ends_at: '09:00' },
    { location_id: 'L1', weekday: 1, starts_at: '08:00', ends_at: '10:00' },
    { location_id: 'L2', weekday: 1, starts_at: '06:00', ends_at: '09:00' },
    { location_id: 'L1', weekday: 2, starts_at: '10:00', ends_at: '09:00' },
  ];
  const e = validateTrainer({ ...base, availability: slots }).availability;
  assert.equal(e[0], undefined);
  assert.match(e[1], /solapa/);
  assert.match(e[2], /sede asignada/);
  assert.match(e[3], /posterior/);
  assert.ok(validateTrainer({ ...base, certifications: [{ name: 'X' }] }).certifications);
  assert.equal(validatePhoto({ type: 'image/gif', size: 10 }), 'Usa una imagen JPG, PNG o WebP.');
  assert.ok(validatePhoto({ type: 'image/png', size: 6 * 1024 * 1024 }));
  assert.equal(normalizeSpecialty('  fuerza   máxima '), 'Fuerza máxima');
});

test('espacios y redirecciones seguras', () => {
  const ws = { gyms: [{ gym_id: 'g1', role: 'owner' }, { gym_id: 'g2', role: 'trainer' }] };
  assert.equal(defaultDestination(ws), '/panel/g1/entrenadores');
  assert.equal(defaultDestination({ gyms: [] }), '/gimnasios');
  assert.equal(canManageGym(ws, 'g2'), false, 'un entrenador no administra entrenadores');
  assert.equal(canManageGym(ws, 'g1'), true);
  assert.equal(safeReturnPath('/panel'), '/panel');
  assert.equal(safeReturnPath('//evil.com'), null);
  assert.equal(safeReturnPath('https://evil.com'), null);
});
