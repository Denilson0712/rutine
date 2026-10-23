# Fase 1 — Auditoría y plan técnico

Fecha: 23 de octubre de 2026 · Rama: `fase-1-2-backend`

## 1. Estado actual (verificado en el código)

### Funciona de verdad
- Landing completa (`src/pages/HomePage.jsx` y `src/components/landing/*`), responsive y accesible.
- Enrutador propio (`src/lib/router.jsx`) con 4 rutas: `/`, `/gimnasios`, `/afiliacion`, `/acceso` y página 404.
- Buscador: filtros estado/ciudad/nombre, mapa de ciudades y filtros en la URL.
- Validación en cliente de los formularios de afiliación y acceso.
- Configuración comercial centralizada (`src/config/business.js`) sin datos inventados.

### Simulado o no conectado
| Pieza | Situación |
| --- | --- |
| `services/gyms.js` | Devuelve siempre lista vacía (`connected: false`). |
| `services/affiliation.js` | No envía nada; responde `not_connected`. |
| `services/auth.js` | No hay cuentas; responde `not_connected`. |
| Panel en la landing | Datos de `src/data/demo.js`, marcados como demostración. |
| Agenda y reservas | Simulación local, marcada como tal. |

### Falta
Backend, base de datos, autenticación, roles, permisos, afiliación con estados, dashboards, marketplace con datos reales, reseñas, finanzas, pagos, panel de administración, pruebas automatizadas y despliegue.

### Problemas técnicos encontrados
1. **No hay pruebas automatizadas** ni script `test` en `package.json`.
2. **El enrutador no soporta parámetros ni rutas protegidas** (`/panel/:gymId/...`). Necesario para los dashboards.
3. **El formulario de afiliación es anónimo.** Con el nuevo modelo, la afiliación debe pertenecer a una cuenta de propietario.
4. **Sin control de versiones**: el proyecto no tenía Git. Se inicializó con un commit base antes de cualquier cambio.
5. No se detectaron errores de compilación ni de ejecución en la versión actual (24 comprobaciones de navegador pasan).

## 2. Arquitectura propuesta

### Opción elegida: Supabase (PostgreSQL + Auth + Storage + RLS)

| | Supabase | API propia (Node + Postgres) |
| --- | --- | --- |
| Autenticación, recuperación, verificación de correo | Incluidas | Hay que construirlas |
| Seguridad multiempresa | RLS en la base de datos: protege aunque el frontend falle | Hay que aplicarla en cada endpoint |
| Almacenamiento de fotos y documentos | Incluido, con políticas | Servicio aparte (S3 u otro) |
| Lógica de negocio sensible | Funciones SQL `security definer` y Edge Functions | Endpoints propios |
| Infraestructura a mantener | Mínima | Servidor, despliegue, parches, copias |
| Dependencia del proveedor | Media: es PostgreSQL estándar y las migraciones son SQL portable | Baja |

**Costos (verificados el 23/10/2026 en supabase.com/pricing):**
- **Free (0 US$)**: 500 MB de base de datos, 50.000 usuarios activos al mes. Se pausa tras 1 semana sin actividad y no tiene copias automáticas. Sirve para desarrollo, no para producción.
- **Pro (desde 25 US$/mes)**: 8 GB de disco, 100.000 usuarios activos, copias diarias durante 7 días y sin pausas. Es el mínimo recomendado para producción.
- La recuperación a un punto en el tiempo (PITR) es un complemento aparte, de 100 US$/mes por 7 días de retención.

**Limitaciones**
- La lógica financiera y los webhooks de pago necesitan Edge Functions (Deno) o un pequeño servidor.
- Para envíos de correo transaccional en producción hace falta un proveedor SMTP propio.

**Migración futura**
Si un día conviene salir de Supabase, el esquema y las migraciones son PostgreSQL estándar. Habría que reemplazar Auth y reescribir las políticas que usan `auth.uid()`.

### Enrutador
Se **mantiene el enrutador propio** y se amplía con parámetros (`/panel/:gymId`), rutas protegidas y layouts. Son unas 80 líneas sin dependencias y se pueden probar aquí.

React Router sería razonable cuando haya muchas rutas anidadas. No se adopta ahora por dos razones: este entorno no puede instalar paquetes para verificarlo, y el enrutador actual cubre lo necesario sin cambiar ninguna ruta pública.

### Capas
```
src/pages, src/components   → interfaz (no habla con la base de datos directamente)
src/services/*              → acceso a datos (único lugar que usa el cliente Supabase)
src/lib/supabase.js         → cliente configurado por variables de entorno
supabase/migrations/*.sql   → esquema, RLS y funciones de negocio (fuente de verdad)
supabase/tests/*.sql        → pruebas de seguridad ejecutables en PostgreSQL
```

Cualquier operación que cambie estados o dinero se hace con **funciones SQL** que validan permisos y transiciones, nunca con un `update` directo desde el navegador.

## 3. Modelo de datos preliminar

| Dominio | Tablas | Fase |
| --- | --- | --- |
| Identidad | `profiles`, `user_roles` (rol de plataforma: `super_admin`, `athlete`) | 2 |
| Gimnasios | `gyms` (con `affiliation_status`), `gym_business_details` (privado), `gym_locations` | 2 |
| Personal | `gym_staff` (owner / manager / receptionist / trainer), `staff_invitations` | 2 |
| Afiliación | `affiliation_events` (historial de decisiones) | 2 |
| Auditoría | `audit_logs` (solo inserción, mediante funciones) | 2 |
| Operación | `athlete_profiles` por gimnasio, `membership_plans`, `memberships`, `trainers`, `classes`, `class_sessions`, `reservations`, `attendance` | 3 |
| Inventario | `inventory_items`, `inventory_movements` | 3 |
| Marketplace | `gym_photos`, `favorites`, `reviews`, `review_reports` | 4 |
| Finanzas | `payments`, `payment_attempts`, `ledger_transactions`, `ledger_entries`, `commission_agreements`, `refunds`, `expenses`, `expense_categories`, `cash_closures`, `payouts`, `reconciliations` | 5 |
| Avisos | `notifications` | 3–5 |

Los roles de empresa **no** se guardan en el perfil. Viven en `gym_staff`, por gimnasio, y así una persona puede ser propietaria de un gimnasio y atleta en otro sin cuentas duplicadas.

El estado de afiliación vive en `gyms.affiliation_status`, y cada cambio deja una fila en `affiliation_events`. Así no hay una segunda tabla de "solicitudes" que duplique el estado.

## 4. Rutas

**Se conservan:** `/`, `/gimnasios`, `/afiliacion`, `/acceso`.

**Nuevas:**

| Ruta | Acceso | Fase |
| --- | --- | --- |
| `/restablecer` | Pública (enlace de recuperación) | 2 |
| `/cuenta` | Atleta autenticado | 2 (base), 4 |
| `/panel` | Personal de gimnasio | 2 (base), 3 |
| `/panel/:gymId/*` | Personal de ese gimnasio | 3 |
| `/admin/*` | `super_admin` | 2 (base), 3–5 |
| `/gimnasios/:slug` | Pública, solo aprobados | 4 |

## 5. Plan de cambios por archivo (fase 2)

| Archivo | Cambio |
| --- | --- |
| `supabase/migrations/*` | Nuevo: esquema, RLS y funciones |
| `supabase/tests/*` | Nuevo: pruebas de seguridad |
| `src/lib/router.jsx` | Ampliar: parámetros y redirecciones (rutas actuales intactas) |
| `src/lib/supabase.js` | Nuevo: cliente opcional por variables de entorno |
| `src/services/auth.js` | Implementación real si Supabase está configurado; si no, el mismo `not_connected` de hoy |
| `src/auth/*` | Nuevo: contexto de sesión, guardas de ruta, cálculo de espacios |
| `src/pages/AccessPage.jsx` | Añadir recuperación de contraseña y redirección por rol |
| `src/App.jsx` | Registrar rutas nuevas |
| `package.json` | Añadir `@supabase/supabase-js` y script `test` (con `node:test`, sin dependencias extra) |

## 6. Riesgos de regresión y mitigación

| Riesgo | Mitigación |
| --- | --- |
| Romper la landing o sus rutas | Mismas pruebas de navegador de la entrega anterior, ejecutadas tras cada fase |
| Fugas de datos entre gimnasios | RLS activado en todas las tablas y pruebas SQL con usuarios de distintos gimnasios |
| Escalamiento de privilegios | Roles en tablas sin permisos de escritura para usuarios; cambios solo vía funciones auditadas |
| Sitio caído si faltan variables de entorno | El cliente Supabase es opcional: sin configuración, la web funciona como hoy y lo indica |
| Datos de demostración confundidos con reales | Los dashboards leen solo de servicios; `demo.js` queda reservado a la landing |
