import { DEMO_GYM } from '../data/demoGym.js';

/**
 * Estado en memoria del modo demostración, compartido por el panel y el perfil
 * público para que los cambios del panel se vean en el perfil (hasta recargar).
 * Nunca se usa cuando hay backend configurado.
 */
let state = structuredClone(DEMO_GYM);

export const getDemoGym = () => state;
export const setDemoGym = (next) => { state = next; };
export const resetDemoGym = () => { state = structuredClone(DEMO_GYM); };
