/**
 * GIMNASIO DE DEMOSTRACIÓN.
 * Solo se usa cuando el backend no está configurado, para mostrar cómo se verá
 * un perfil. Todas las pantallas que lo usan muestran un aviso visible.
 * No representa a ningún gimnasio ni persona real. Sin fotos de personas.
 */
const L1 = 'demo-loc-chacao';

/** Imagen gráfica de ejemplo (no es una foto real) para mostrar la galería. */
function demoPhoto(label, variant) {
  const hue = [150, 160, 140, 155, 145][variant % 5];
  const cx = [80, 20, 50, 90, 10][variant % 5];
  const rings = Array.from({ length: 14 }, (_, i) => `<circle cx="${cx}%" cy="115%" r="${60 + i * 46}" fill="none" stroke="hsla(${hue},85%,60%,0.22)" stroke-width="1.5"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},14%,14%)"/><stop offset="1" stop-color="hsl(${hue},10%,7%)"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/>${rings}<text x="600" y="385" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#f1f4ef">${label}</text><text x="600" y="440" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#a9b1aa">Foto de ejemplo</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
const L2 = 'demo-loc-altamira';

export const DEMO_GYM = {
  isDemo: true,
  id: 'demo',
  slug: 'demo',
  trade_name: 'Gimnasio de demostración',
  affiliation_status: 'approved',
  description:
    'Este es un perfil de ejemplo para mostrar cómo verán los atletas a un gimnasio afiliado: su información, sus planes, sus horarios y su equipo de entrenadores.',
  amenities: ['Zona de peso libre', 'Máquinas guiadas', 'Área funcional', 'Duchas', 'Lockers', 'Estacionamiento'],
  services: ['Entrenamiento personal', 'Clases grupales', 'Evaluación física', 'Plan de entrenamiento'],
  public_phone: null,
  public_email: null,
  public_whatsapp: null,
  instagram: null,
  // Reseñas DE EJEMPLO para mostrar cómo se ven las estrellas en el perfil.
  rating: { average: 4.6, count: 28, isExample: true },
  photos: [
    'Zona de peso libre', 'Área funcional', 'Máquinas guiadas', 'Sala de clases', 'Vestuarios',
  ].map((label, i) => ({ id: `ph${i}`, storage_path: demoPhoto(label, i), alt_text: `${label} (imagen de ejemplo)`, sort_order: i })),
  classes: [],
  locations: [
    {
      id: L1, name: 'Sede Chacao', state: 'Miranda', city: 'Caracas', address: 'Dirección de ejemplo, Chacao',
      latitude: 10.4969, longitude: -66.8533, is_primary: true,
      hours: [1, 2, 3, 4, 5].map((d) => ({ weekday: d, opens_at: '05:30', closes_at: '22:00' }))
        .concat([{ weekday: 6, opens_at: '07:00', closes_at: '18:00' }, { weekday: 7, opens_at: '08:00', closes_at: '13:00' }]),
    },
    {
      id: L2, name: 'Sede Altamira', state: 'Miranda', city: 'Caracas', address: 'Dirección de ejemplo, Altamira',
      latitude: 10.4962, longitude: -66.8473, is_primary: false,
      hours: [1, 2, 3, 4, 5].map((d) => ({ weekday: d, opens_at: '06:00', closes_at: '21:00' }))
        .concat([{ weekday: 6, opens_at: '08:00', closes_at: '14:00' }]),
    },
  ],
  plans: [
    { id: 'p1', name: 'Inscripción', kind: 'enrollment', price_amount: 15, currency: 'RUN', description: 'Pago único al registrarte. Incluye evaluación inicial.', sort_order: 0 },
    { id: 'p2', name: 'Plan mensual', kind: 'monthly', price_amount: 30, currency: 'RUN', description: 'Acceso libre en horario de atención.', sort_order: 1 },
    { id: 'p3', name: 'Plan trimestral', kind: 'quarterly', price_amount: 80, currency: 'RUN', description: 'Acceso libre durante 3 meses.', sort_order: 2 },
    { id: 'p4', name: 'Plan anual', kind: 'annual', price_amount: 290, currency: 'RUN', description: 'Acceso libre durante 12 meses.', sort_order: 3 },
    { id: 'p5', name: 'Clase individual', kind: 'single_class', price_amount: 6, currency: 'RUN', description: 'Una clase grupal, sujeta a cupos.', sort_order: 4 },
  ],
  trainers: [
    {
      id: 'demo-t1', slug: 'andrea-rios', full_name: 'Andrea Ríos', headline: 'Fuerza y técnica de levantamiento',
      bio: 'Perfil de ejemplo. Aquí el gimnasio describe la trayectoria del entrenador, su forma de trabajar y a quién puede ayudar.',
      specialties: ['Fuerza', 'Musculación', 'Técnica'], experience_years: 7, photo_path: null, is_public: true, status: 'active',
      location_ids: [L1],
      availability: [
        { location_id: L1, weekday: 1, starts_at: '06:00', ends_at: '10:00' },
        { location_id: L1, weekday: 3, starts_at: '06:00', ends_at: '10:00' },
        { location_id: L1, weekday: 5, starts_at: '16:00', ends_at: '20:00' },
      ],
      certifications: [
        { id: 'c1', name: 'Certificación de entrenamiento de fuerza (ejemplo)', issuer: 'Entidad de ejemplo', year: 2019, verified_at: '2026-01-10T00:00:00Z' },
        { id: 'c2', name: 'Primeros auxilios (ejemplo)', issuer: 'Entidad de ejemplo', year: 2024, verified_at: null },
      ],
    },
    {
      id: 'demo-t2', slug: 'luis-contreras', full_name: 'Luis Contreras', headline: 'Entrenamiento funcional y HIIT',
      bio: 'Perfil de ejemplo. Clases grupales de alta intensidad y acondicionamiento físico general.',
      specialties: ['Funcional', 'HIIT', 'Acondicionamiento'], experience_years: 4, photo_path: null, is_public: true, status: 'active',
      location_ids: [L1, L2],
      availability: [
        { location_id: L2, weekday: 2, starts_at: '17:00', ends_at: '21:00' },
        { location_id: L1, weekday: 4, starts_at: '17:00', ends_at: '21:00' },
      ],
      certifications: [],
    },
    {
      id: 'demo-t3', slug: 'maria-fernandez', full_name: 'María Fernández', headline: 'Movilidad y entrenamiento para principiantes',
      bio: 'Perfil de ejemplo. Acompaña a personas que empiezan a entrenar o vuelven después de una pausa.',
      specialties: ['Movilidad', 'Principiantes'], experience_years: 3, photo_path: null, is_public: true, status: 'active',
      location_ids: [L2], availability: [], certifications: [],
    },
    {
      id: 'demo-t4', slug: 'jose-gil', full_name: 'José Gil', headline: 'Ciclismo indoor',
      bio: 'Perfil de ejemplo en estado inactivo: no aparece en el perfil público.',
      specialties: ['Spinning', 'Cardio'], experience_years: 2, photo_path: null, is_public: false, status: 'inactive',
      location_ids: [L2], availability: [], certifications: [],
    },
  ],
};
