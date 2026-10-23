import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El servidor de desarrollo de Vite ya responde con index.html en cualquier ruta,
// así que /gimnasios, /afiliacion y /acceso funcionan al recargar la página.
export default defineConfig({
  plugins: [react()],
});
