/**
 * Estados de Venezuela y ciudades principales para el buscador.
 * No representan gimnasios afiliados: solo ubicaciones donde buscar.
 */
export const STATES = [
  { name: 'Amazonas', cities: ['Puerto Ayacucho'] },
  { name: 'Anzoátegui', cities: ['Barcelona', 'Puerto La Cruz', 'Lechería', 'El Tigre'] },
  { name: 'Apure', cities: ['San Fernando de Apure'] },
  { name: 'Aragua', cities: ['Maracay', 'Turmero', 'Cagua', 'La Victoria'] },
  { name: 'Barinas', cities: ['Barinas'] },
  { name: 'Bolívar', cities: ['Ciudad Guayana', 'Ciudad Bolívar'] },
  { name: 'Carabobo', cities: ['Valencia', 'Naguanagua', 'San Diego', 'Guacara', 'Puerto Cabello'] },
  { name: 'Cojedes', cities: ['San Carlos'] },
  { name: 'Delta Amacuro', cities: ['Tucupita'] },
  { name: 'Distrito Capital', cities: ['Caracas'] },
  { name: 'Falcón', cities: ['Coro', 'Punto Fijo'] },
  { name: 'Guárico', cities: ['San Juan de los Morros', 'Calabozo', 'Valle de la Pascua'] },
  { name: 'La Guaira', cities: ['La Guaira', 'Catia La Mar'] },
  { name: 'Lara', cities: ['Barquisimeto', 'Cabudare', 'Carora'] },
  { name: 'Mérida', cities: ['Mérida', 'El Vigía'] },
  { name: 'Miranda', cities: ['Los Teques', 'Guarenas', 'Guatire', 'Charallave'] },
  { name: 'Monagas', cities: ['Maturín'] },
  { name: 'Nueva Esparta', cities: ['Porlamar', 'Pampatar', 'La Asunción'] },
  { name: 'Portuguesa', cities: ['Acarigua', 'Araure', 'Guanare'] },
  { name: 'Sucre', cities: ['Cumaná', 'Carúpano'] },
  { name: 'Táchira', cities: ['San Cristóbal'] },
  { name: 'Trujillo', cities: ['Valera', 'Trujillo'] },
  { name: 'Yaracuy', cities: ['San Felipe'] },
  { name: 'Zulia', cities: ['Maracaibo', 'Cabimas', 'Ciudad Ojeda'] },
];

export function stateOfCity(city) {
  return STATES.find((s) => s.cities.includes(city))?.name ?? '';
}

/**
 * Ciudades de referencia para el mapa esquemático.
 * Coordenadas aproximadas (latitud, longitud) proyectadas de forma simple.
 */
export const MAP_CITIES = [
  { city: 'Maracaibo', lat: 10.65, lon: -71.64 },
  { city: 'Coro', lat: 11.4, lon: -69.67 },
  { city: 'Mérida', lat: 8.59, lon: -71.14 },
  { city: 'San Cristóbal', lat: 7.77, lon: -72.22 },
  { city: 'Barinas', lat: 8.62, lon: -70.21 },
  { city: 'Barquisimeto', lat: 10.07, lon: -69.32 },
  { city: 'Valencia', lat: 10.16, lon: -68.0 },
  { city: 'Caracas', lat: 10.49, lon: -66.88 },
  { city: 'Barcelona', lat: 10.13, lon: -64.68 },
  { city: 'Cumaná', lat: 10.46, lon: -64.17 },
  { city: 'Porlamar', lat: 10.96, lon: -63.85 },
  { city: 'Maturín', lat: 9.75, lon: -63.18 },
  { city: 'Ciudad Guayana', lat: 8.35, lon: -62.65 },
];

export const MAP_LINKS = [
  ['Maracaibo', 'Coro'],
  ['Maracaibo', 'Mérida'],
  ['Mérida', 'San Cristóbal'],
  ['Mérida', 'Barinas'],
  ['Barinas', 'Barquisimeto'],
  ['Coro', 'Barquisimeto'],
  ['Barquisimeto', 'Valencia'],
  ['Valencia', 'Caracas'],
  ['Caracas', 'Barcelona'],
  ['Barcelona', 'Cumaná'],
  ['Cumaná', 'Porlamar'],
  ['Barcelona', 'Maturín'],
  ['Cumaná', 'Maturín'],
  ['Maturín', 'Ciudad Guayana'],
];

export const FEATURED_CITIES = ['Caracas', 'Valencia', 'Maracaibo', 'Barquisimeto', 'Maracay', 'Barcelona', 'Mérida', 'Porlamar'];
