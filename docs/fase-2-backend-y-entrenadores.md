# Fase 2 + entrenadores por gimnasio — informe

Rama: `fase-1-2-backend`

## Qué quedó operativo

### Backend (PostgreSQL / Supabase)

| Migración | Contenido |
| --- | --- |
| `0100_identity` | Perfiles, roles de plataforma (`super_admin`, `athlete`), auditoría inmutable, alta automática de usuarios y primer administrador |
| `0200_gyms_affiliation` | Gimnasios, datos comerciales privados, sedes, personal por gimnasio (`owner`, `manager`, `receptionist`, `trainer`), invitaciones con token cifrado y flujo de afiliación `draft → submitted → under_review → approved / rejected / suspended` con historial |
| `0300_privileges` | Retira permisos por defecto y concede solo lo necesario |
| `0400_public_profile_trainers` | Fotos, horarios por sede, planes y precios, entrenadores **por gimnasio**, certificaciones, sedes y disponibilidad |
| `0500_storage` | Bucket `gym-media` con escritura limitada a la carpeta del propio gimnasio |
| `0600_public_contact` | Datos de contacto que el gimnasio decide publicar |
| `0700_save_trainer` | Guardado atómico de la ficha de entrenador |

**Pruebas:** 101 pruebas SQL (`supabase/tests/*_test.sql`) cubren:
- Aislamiento entre gimnasios.
- Escalamiento de privilegios.
- Transiciones de afiliación.
- Invitaciones.
- Permisos del entrenador.
- Visibilidad pública.
- Almacenamiento.
- Atomicidad.

Además, se rompieron políticas a propósito y las pruebas detectaron cada fallo.

### Frontend

| Ruta | Estado |
| --- | --- |
| `/gimnasios/:slug` | Perfil completo del gimnasio: portada, ubicación, reseñas (estado vacío honesto), descripción, instalaciones, precios separados por concepto, horarios por sede, **Nuestros entrenadores**, clases (vacío), mapa y contacto |
| `/gimnasios/:slug/entrenadores/:trainer` | Perfil del entrenador **dentro** de su gimnasio. No existe un directorio global |
| `/panel` | Selector de gimnasios que administra la persona |
| `/panel/:gymId/entrenadores` | Lista, filtros, búsqueda, publicar/ocultar |
| `/panel/:gymId/entrenadores/:id` (o `nuevo`) | Alta y edición: foto, especialidades, descripción, experiencia, certificaciones, sedes, horarios y visibilidad |
| `/acceso`, `/restablecer` | Inicio de sesión, registro y recuperación de contraseña con Supabase Auth |

Se conservan intactas `/`, `/gimnasios`, `/afiliacion` y `/acceso`. Las 24 pruebas de navegador de la landing siguen pasando.

## Modo demostración

Sin variables de entorno, la app no simula un backend:
- Muestra un **gimnasio de demostración** marcado en cada pantalla.
- El panel guarda en memoria y avisa de que los cambios se pierden al recargar.
- Los entrenadores de ejemplo usan iniciales, nunca fotos de personas.

## Cómo activar el backend

1. Crea un proyecto en Supabase. El plan Pro es el mínimo recomendado para producción, por las copias diarias.
2. Aplica las migraciones en orden. Con la CLI: `supabase link` y luego `supabase db push`. Sin ella, pega cada archivo de `supabase/migrations/` en el editor SQL.
3. Copia `.env.example` como `.env.local` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. `npm install` (incluye `@supabase/supabase-js`) y `npm run dev`.
5. Regístrate en la app con tu correo. Luego, en el editor SQL de Supabase, ejecuta **una sola vez**:
   `select public.bootstrap_super_admin('tu-correo@dominio.com');`
6. En Auth → URL Configuration, añade `https://tu-dominio/restablecer` y `https://tu-dominio/acceso` como URL de redirección.

Nunca pongas la clave `service_role` en el frontend ni en `.env.local`.

## Comandos de verificación

```bash
npm test          # 6 suites de pruebas unitarias (node:test, sin dependencias)
npm run test:db   # migraciones + 101 pruebas SQL en un PostgreSQL local (PGHOST/PGPORT)
npm run build     # compilación de producción con Vite
```

## Pendiente (siguientes fases)

- **No probado contra un Supabase real.** Este entorno no tiene acceso a npm ni a una cuenta de Supabase. Las consultas del frontend siguen la API documentada de `supabase-js` v2, pero hay que validarlas en tu proyecto.
- `npm run build` con Vite no se pudo ejecutar aquí: se compiló con esbuild y React 19.
- La afiliación con cuenta de propietario: hoy el formulario `/afiliacion` sigue siendo el anterior. Las funciones SQL (`create_gym`, `submit_affiliation`) ya existen.
- Panel del super administrador (`/admin`), espacio del atleta (`/cuenta`), envío de correos de invitación (requiere SMTP o Edge Function).
- Gestión de fotos del gimnasio, planes y horarios desde el panel (las tablas y políticas ya existen).
- Clases y reservas (fase 3), reseñas verificadas (fase 4), finanzas y pagos (fase 5).
- La autoedición del entrenador está soportada en la base de datos (`trainer_accounts.self_edit_allowed`), pero aún no tiene pantalla.
