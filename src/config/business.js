/**
 * Datos comerciales de Rutine.
 *
 * Todo lo que está en `null` todavía no está definido por el negocio.
 * La landing NO muestra un dato mientras siga en `null`: en su lugar
 * explica que se informará durante la afiliación o simplemente omite el bloque.
 */
export const business = {
  brandName: 'Rutine',

  // Porcentaje de comisión (número, por ejemplo 8 para 8 %).
  // PENDIENTE DE CONFIRMACIÓN: mientras sea null no se publica ninguna cifra.
  commissionRate: null,

  // Texto opcional sobre a qué operaciones se aplica la comisión.
  // PENDIENTE DE CONFIRMACIÓN.
  commissionScope: null,

  // Contacto público. Se muestra en el pie de página solo si existe.
  contactEmail: null,
  contactWhatsapp: null,

  // Enlaces legales. Se muestran solo cuando existan páginas reales.
  termsUrl: null,
  privacyUrl: null,

  // Redes sociales reales, por ejemplo: [{ label: 'Instagram', url: 'https://instagram.com/...' }]
  social: [],
};
