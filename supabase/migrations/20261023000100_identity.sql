-- =============================================================================
-- Rutine · 0100 · Identidad, roles de plataforma y auditoría
-- =============================================================================
-- Principios:
--  * Los roles NUNCA se leen de metadatos que el usuario controla (raw_user_meta_data).
--  * Las tablas de roles no tienen políticas de escritura: solo cambian mediante
--    funciones SECURITY DEFINER que validan permisos y dejan auditoría.
--  * Todas las funciones SECURITY DEFINER fijan search_path = '' y califican
--    cada objeto con su esquema para evitar secuestro de búsqueda.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

create type public.platform_role as enum ('super_admin', 'athlete');

-- -----------------------------------------------------------------------------
-- Perfiles
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (full_name is null or char_length(full_name) between 1 and 120),
  phone       text check (phone is null or phone ~ '^\+?[0-9]{7,15}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Datos básicos de cada cuenta. No contiene roles ni permisos.';

-- -----------------------------------------------------------------------------
-- Roles de plataforma (los roles de empresa viven en gym_staff)
-- -----------------------------------------------------------------------------
create table public.user_roles (
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.platform_role not null,
  granted_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (user_id, role)
);

create index user_roles_role_idx on public.user_roles (role);

-- -----------------------------------------------------------------------------
-- Auditoría: solo inserción, siempre desde funciones de confianza
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references auth.users (id) on delete set null,
  action      text not null check (char_length(action) <= 80),
  entity      text not null check (char_length(entity) <= 60),
  entity_id   text,
  gym_id      uuid,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index audit_logs_gym_idx on public.audit_logs (gym_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

comment on table public.audit_logs is 'Registro inmutable de acciones sensibles. No guardar contraseñas, tokens ni datos personales innecesarios.';

-- -----------------------------------------------------------------------------
-- Funciones auxiliares
-- -----------------------------------------------------------------------------
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

-- Escritura interna de auditoría. No se concede a usuarios: solo la llaman
-- otras funciones SECURITY DEFINER (que se ejecutan como su propietario).
create function public.write_audit(
  p_action text,
  p_entity text,
  p_entity_id text,
  p_gym_id uuid,
  p_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, action, entity, entity_id, gym_id, details)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_gym_id, coalesce(p_details, '{}'::jsonb));
$$;

-- Bloquea UPDATE/DELETE incluso para roles con privilegios de tabla.
create function public.audit_logs_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_logs es de solo inserción' using errcode = '42501';
end;
$$;

create trigger audit_logs_no_update before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- -----------------------------------------------------------------------------
-- Alta de usuarios: perfil + rol de atleta
-- -----------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(v_name, 120));

  -- Toda cuenta nueva es atleta. Los roles de empresa se obtienen creando
  -- un gimnasio o aceptando una invitación; super_admin solo por bootstrap.
  insert into public.user_roles (user_id, role) values (new.id, 'athlete');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Primer super administrador
-- Ejecutar UNA vez desde el editor SQL de Supabase (rol postgres/service_role):
--   select public.bootstrap_super_admin('correo@dominio.com');
-- Falla si ya existe algún super_admin.
-- -----------------------------------------------------------------------------
create function public.bootstrap_super_admin(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  if exists (select 1 from public.user_roles where role = 'super_admin') then
    raise exception 'Ya existe un super administrador. Usa el panel de administración.' using errcode = '42501';
  end if;

  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'No existe una cuenta con ese correo. Regístrala primero.' using errcode = 'P0002';
  end if;

  insert into public.user_roles (user_id, role) values (v_user, 'super_admin');
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (null, 'platform.bootstrap_super_admin', 'user', v_user::text, '{}'::jsonb);
  return v_user;
end;
$$;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_super_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy user_roles_select_own on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

-- Sin políticas de INSERT/UPDATE/DELETE en user_roles: nadie puede asignarse roles.

create policy audit_logs_select_admin on public.audit_logs
  for select to authenticated
  using (public.is_super_admin());
