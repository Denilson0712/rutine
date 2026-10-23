/** Utilidades puras de presentación (sin React), probadas con node:test. */

export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const PLAN_KIND_LABEL = {
  enrollment: 'Inscripción',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
  single_class: 'Clase individual',
  custom: 'Plan especial',
};

const PER = {
  monthly: 'al mes',
  quarterly: 'por 3 meses',
  semiannual: 'por 6 meses',
  annual: 'por año',
  single_class: 'por clase',
  enrollment: 'pago único',
};

export function priceSuffix(plan) {
  if (PER[plan.kind]) return PER[plan.kind];
  return plan.duration_days ? `por ${plan.duration_days} días` : '';
}

export function formatPrice(amount, currency = 'USD') {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  const value = n.toLocaleString('es-VE', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return currency === 'VES' ? `Bs. ${value}` : `US$ ${value}`;
}

/** Separa inscripción, membresías y clases sueltas para que cada precio se entienda. */
export function groupPlans(plans = []) {
  const sorted = [...plans].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return {
    enrollment: sorted.filter((p) => p.kind === 'enrollment'),
    memberships: sorted.filter((p) => !['enrollment', 'single_class'].includes(p.kind)),
    single: sorted.filter((p) => p.kind === 'single_class'),
  };
}

export function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h < 12 ? 'a. m.' : 'p. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/**
 * Agrupa franjas por día ISO (1–7) → [{ weekday, label, ranges: ['6:00 a. m. – 10:00 a. m.'] }]
 * Solo devuelve los días con franjas.
 */
export function groupByWeekday(slots = [], startKey = 'starts_at', endKey = 'ends_at') {
  const byDay = new Map();
  for (const s of slots) {
    if (!byDay.has(s.weekday)) byDay.set(s.weekday, []);
    byDay.get(s.weekday).push(s);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekday, list]) => ({
      weekday,
      label: WEEKDAYS[weekday - 1],
      ranges: list
        .sort((a, b) => a[startKey].localeCompare(b[startKey]))
        .map((s) => `${formatTime(s[startKey])} – ${formatTime(s[endKey])}`),
    }));
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Texto del resumen de reseñas: nunca muestra estrellas sin reseñas reales. */
export function ratingSummary(rating) {
  if (!rating || !rating.count) return { hasReviews: false, text: 'Aún no tiene reseñas' };
  const avg = Math.round(rating.average * 10) / 10;
  return {
    hasReviews: true,
    average: avg,
    text: `${avg.toLocaleString('es-VE')} de 5 · ${rating.count} ${rating.count === 1 ? 'reseña' : 'reseñas'}`,
  };
}
