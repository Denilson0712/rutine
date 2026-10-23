export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Teléfonos venezolanos: 04XX-XXXXXXX, 02XX-XXXXXXX o con +58. Se ignoran espacios y guiones.
export const VE_PHONE_RE = /^(?:\+?58|0)?(?:2\d{2}|4(?:12|14|16|24|26|22))\d{7}$/;

export function normalizePhone(value) {
  return value.replace(/[\s\-().]/g, '');
}
