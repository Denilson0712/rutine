-- =============================================================================
-- Rutine · 0600 · Contacto público del gimnasio
-- =============================================================================
-- Los datos de gym_business_details son privados (uso administrativo).
-- Estos campos son los que el gimnasio decide mostrar a los atletas.
-- =============================================================================
alter table public.gyms
  add column public_phone    text check (public_phone is null or public_phone ~ '^\+?[0-9]{7,15}$'),
  add column public_email    text check (public_email is null or public_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  add column public_whatsapp text check (public_whatsapp is null or public_whatsapp ~ '^\+?[0-9]{7,15}$'),
  add column instagram       text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$');
