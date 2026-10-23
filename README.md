# Rutine

Landing page y primeras pantallas de **Rutine**, la plataforma que conecta gimnasios, entrenadores y atletas en Venezuela.

Proyecto en **React 19 + Vite**, sin dependencias adicionales: iconos, enrutador y gráficos están hechos dentro del proyecto.

## Cómo ejecutarlo

Necesitas Node.js 20 o superior.

```bash
npm install
npm run dev       # servidor de desarrollo en http://localhost:5173
npm run build     # build de producción en /dist
npm run preview   # sirve el build para revisarlo
```

## Backend y documentación por fases

- `docs/fase-1-auditoria.md`: auditoría y plan técnico.
- `docs/fase-2-backend-y-entrenadores.md`: qué está operativo, cómo activar Supabase y qué falta.
- `supabase/migrations/`: esquema, seguridad (RLS) y funciones de negocio.
- `npm test` (pruebas unitarias) y `npm run test:db` (pruebas de seguridad en PostgreSQL).

Sin `.env.local`, la app funciona en **modo demostración** y lo indica en cada pantalla.

## Rutas

| Ruta | Qué muestra |
| --- | --- |
| `/` | Landing completa |
| `/gimnasios` | Buscador de gimnasios (acepta `?estado=&ciudad=&nombre=`) |
| `/afiliacion` | Formulario de solicitud de afiliación |
| `/acceso` | Iniciar sesión, crear cuenta, recuperar contraseña |
| `/restablecer` | Crear contraseña nueva desde el enlace del correo |
| `/gimnasios/:slug` | Perfil público del gimnasio con «Nuestros entrenadores» |
| `/gimnasios/:slug/entrenadores/:trainer` | Perfil del entrenador dentro de su gimnasio |
| `/panel` y `/panel/:gymId/entrenadores` | Panel del gimnasio: módulo Entrenadores |

Al publicar en un hosting estático, todas las rutas deben responder con `index.html`. Ya se incluyen `public/_redirects` (Netlify) y `vercel.json` (Vercel).

## Lo que debes completar tú

Todo está centralizado para que no tengas que tocar los componentes:

- **`src/config/business.js`**: porcentaje de comisión, correo, WhatsApp, redes y páginas legales. Mientras un valor sea `null`, la web no lo muestra ni inventa nada.
- **`src/config/media.js`**: fotografías del hero y de la sección de atletas. Copia tus fotos a `public/img/` y escribe la ruta. Sin foto se muestra un fondo gráfico.
- **`src/services/`**: los tres puntos de conexión con el backend.
  - `gyms.js`: búsqueda de gimnasios (hoy devuelve lista vacía).
  - `affiliation.js`: envío de solicitudes (hoy avisa que no está conectado).
  - `auth.js`: inicio de sesión y registro (hoy avisan que no están conectados).

## Qué es real y qué es demostración

| Funciona de verdad | Es ilustrativo (marcado en pantalla) |
| --- | --- |
| Navegación, menú móvil, enlaces a secciones | Cifras del panel (ingresos, membresías, sesiones) |
| Buscador: filtros por estado/ciudad, mapa, URL compartible | Perfiles de entrenadores |
| Validación de formularios de afiliación y acceso | Agenda y botones «Simular reserva / cancelación» |
| Pestañas, acordeones, accesibilidad por teclado | Tarjetas flotantes del hero |

Ningún formulario simula un envío correcto: mientras no haya backend, la página lo dice claramente y conserva los datos.

## Estructura

```
src/
  App.jsx                 rutas y títulos por página
  lib/router.jsx          enrutador mínimo (History API)
  config/                 datos del negocio y fotografías
  data/                   textos, estados de Venezuela, datos de demostración
  services/               puntos de integración con backend
  components/layout/      Navbar, Footer
  components/landing/     una sección por archivo
  components/ui/          piezas reutilizables (Icon, Field, Photo…)
  pages/                  Inicio, Explorar, Afiliación, Acceso, 404
  styles/                 global.css (tokens y base), landing.css, pages.css
```
