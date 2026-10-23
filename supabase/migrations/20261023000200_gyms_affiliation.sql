-- =============================================================================
-- Rutine · 0200 · Gimnasios, sedes, personal y afiliación
-- =============================================================================
-- Aislamiento multiempresa: toda fila de negocio pertenece a un gym_id y las
-- políticas comprueban la pertenencia del usuario a ese gimnasio en gym_staff.
-- El estado de afiliación solo cambia mediante funciones que validan la
-- transición, registran el historial y escriben auditoría.
-- =============================================================================

create type public.gym_role as enum ('owner', 'manager', 'receptionist', 'trainer');
create type public.staff_status as enum ('active', 'revoked');
create type public.affiliation_status as enum
  ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'suspended');

-- -----------------------------------------------------------------------------
-- Tablas
-- -----------------------------------------------------------------------------
create table public.gyms (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  trade_name         text not null check (char_length(trim(trade_name)) between 2 and 80),
  description        text check (description is null or char_length(description) <= 2000),
  affiliation_status public.affiliation_status not null default 'draft',
  terms_version      text,
  terms_accepted_at  timestamptz,
  terms_accepted_by  uuid references auth.users (id) on delete set null,
  approved_at        timestamptz,
  created_by         uuid not null references auth.users (id) on delete restrict,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index gyms_status_idx on public.gyms (affiliation_status);

comment on column public.gyms.affiliation_status is
  'Solo cambia mediante submit_affiliation, reopen_affiliation y admin_set_affiliation_status.';

-- Datos comerciales privados: nunca visibles para atletas ni para el público.
create table public.gym_business_details (
  gym_id         uuid primary key references public.gyms (id) on delete cascade,
  legal_name     text check (legal_name is null or char_length(legal_name) between 2 and 160),
  rif            text check (rif is null or rif ~ '^[JVEGP]-?[0-9]{8}-?[0-9]$'),
  contact_email  text check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  contact_phone  text check (contact_phone is null or contact_phone ~ '^\+?[0-9]{7,15}$'),
  updated_at     timestamptz not null default now()
);

create table public.gym_locations (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid not null references public.gyms (id) on delete cascade,
  name        text not null check (char_length(trim(name)) between 2 and 80),
  state       text not null check (char_length(state) between 2 and 40),
  city        text not null check (char_length(city) between 2 and 60),
  address     text check (address is null or char_length(address) <= 240),
  latitude    numeric(9, 6) check (latitude is null or latitude between -90 and 90),
  longitude   numeric(9, 6) check (longitude is null or longitude between -180 and 180),
  timezone    text not null default 'America/Caracas',
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index gym_locations_gym_idx on public.gym_locations (gym_id);
create index gym_locations_city_idx on public.gym_locations (state, city);
create unique index gym_locations_one_primary on public.gym_locations (gym_id) where is_primary;

create table public.gym_staff (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid not null references public.gyms (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.gym_role not null,
  status      public.staff_status not null default 'active',
  invited_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (gym_id, user_id)
);

create index gym_staff_user_idx on public.gym_staff (user_id) where status = 'active';
create unique index gym_staff_one_owner on public.gym_staff (gym_id) where role = 'owner' and status = 'active';

create table public.staff_invitations (
  id           uuid primary key default gen_random_uuid(),
  gym_id       uuid not null references public.gyms (id) on delete cascade,
  email        text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  role         public.gym_role not null check (role <> 'owner'),
  token_hash   bytea not null unique,
  invited_by   uuid not null references auth.users (id) on delete cascade,
  expires_at   timestamptz not null default now() + interval '7 days',
  accepted_at  timestamptz,
  accepted_by  uuid references auth.users (id) on delete set null,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index staff_invitations_gym_idx on public.staff_invitations (gym_id, created_at desc);

create table public.affiliation_events (
  id           bigint generated always as identity primary key,
  gym_id       uuid not null references public.gyms (id) on delete cascade,
  from_status  public.affiliation_status,
  to_status    public.affiliation_status not null,
  actor_id     uuid references auth.users (id) on delete set null,
  note         text check (note is null or char_length(note) <= 1000),
  created_at   timestamptz not null default now()
);

create index affiliation_events_gym_idx on public.affiliation_events (gym_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Funciones de permisos (usadas por las políticas)
-- -----------------------------------------------------------------------------
create function public.has_gym_role(p_gym uuid, p_roles public.gym_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.gym_staff
    where gym_id = p_gym
      and user_id = auth.uid()
      and status = 'active'
      and role = any (p_roles)
  );
$$;

create function public.is_gym_member(p_gym uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_gym_role(p_gym, array['owner', 'manager', 'receptionist', 'trainer']::public.gym_role[]);
$$;

create function public.is_gym_admin(p_gym uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_gym_role(p_gym, array['owner', 'manager']::public.gym_role[]);
$$;

-- Los datos del gimnasio solo se editan en borrador o cuando ya está aprobado.
-- Durante la revisión se congelan para que el administrador evalúe datos estables.
create function public.gym_is_editable(p_gym uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.gyms
    where id = p_gym and affiliation_status in ('draft', 'approved')
  );
$$;

create function public.gym_is_public(p_gym uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.gyms where id = p_gym and affiliation_status = 'approved');
$$;

-- -----------------------------------------------------------------------------
-- Protección de columnas controladas por el sistema
-- -----------------------------------------------------------------------------
create function public.gyms_guard_system_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Las funciones SECURITY DEFINER se ejecutan como su propietario, no como
  -- anon/authenticated: solo ellas pueden tocar estas columnas.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.slug is distinct from old.slug
     or new.affiliation_status is distinct from old.affiliation_status
     or new.terms_version is distinct from old.terms_version
     or new.terms_accepted_at is distinct from old.terms_accepted_at
     or new.terms_accepted_by is distinct from old.terms_accepted_by
     or new.approved_at is distinct from old.approved_at
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Este dato solo puede cambiarse mediante el proceso de afiliación.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger gyms_guard before update on public.gyms
  for each row execute function public.gyms_guard_system_columns();

create trigger gyms_touch before update on public.gyms
  for each row execute function public.touch_updated_at();
create trigger gym_locations_touch before update on public.gym_locations
  for each row execute function public.touch_updated_at();
create trigger gym_business_details_touch before update on public.gym_business_details
  for each row execute function public.touch_updated_at();
create trigger gym_staff_touch before update on public.gym_staff
  for each row execute function public.touch_updated_at();

create function public.gym_locations_guard_gym()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.gym_id is distinct from old.gym_id then
    raise exception 'Una sede no puede moverse a otro gimnasio.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger gym_locations_guard before update on public.gym_locations
  for each row execute function public.gym_locations_guard_gym();

-- -----------------------------------------------------------------------------
-- Funciones de negocio
-- -----------------------------------------------------------------------------
create function public.slugify(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    lower(translate(p_text, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')),
    '[^a-z0-9]+', '-', 'g'));
$$;

-- Crea un gimnasio en borrador y convierte al usuario en su propietario.
create function public.create_gym(p_trade_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id   uuid := gen_random_uuid();
  v_base text;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_trade_name, ''))) not between 2 and 80 then
    raise exception 'El nombre comercial debe tener entre 2 y 80 caracteres.' using errcode = '22023';
  end if;
  -- Límite contra abuso: como máximo 5 borradores abiertos por cuenta.
  if (select count(*) from public.gyms where created_by = v_user and affiliation_status = 'draft') >= 5 then
    raise exception 'Tienes demasiados gimnasios en borrador. Completa o elimina alguno.' using errcode = '54000';
  end if;

  v_base := nullif(public.slugify(p_trade_name), '');
  insert into public.gyms (id, slug, trade_name, created_by)
  values (v_id, coalesce(v_base, 'gimnasio') || '-' || substr(replace(v_id::text, '-', ''), 1, 6), trim(p_trade_name), v_user);

  insert into public.gym_business_details (gym_id) values (v_id);
  insert into public.gym_staff (gym_id, user_id, role, invited_by) values (v_id, v_user, 'owner', v_user);
  insert into public.affiliation_events (gym_id, from_status, to_status, actor_id)
  values (v_id, null, 'draft', v_user);
  perform public.write_audit('gym.create', 'gym', v_id::text, v_id, jsonb_build_object('trade_name', trim(p_trade_name)));
  return v_id;
end;
$$;

create function public.accept_affiliation_terms(p_gym uuid, p_terms_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_gym_role(p_gym, array['owner']::public.gym_role[]) then
    raise exception 'Solo el propietario puede aceptar las condiciones.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.gyms where id = p_gym and affiliation_status = 'draft') then
    raise exception 'Las condiciones se aceptan mientras la solicitud está en borrador.' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_terms_version, ''))) not between 1 and 40 then
    raise exception 'Versión de condiciones no válida.' using errcode = '22023';
  end if;

  update public.gyms
     set terms_version = trim(p_terms_version), terms_accepted_at = now(), terms_accepted_by = auth.uid()
   where id = p_gym;

  perform public.write_audit('gym.accept_terms', 'gym', p_gym::text, p_gym, jsonb_build_object('terms_version', trim(p_terms_version)));
end;
$$;

-- Cambio interno de estado: valida, registra historial y auditoría.
create function public.apply_affiliation_transition(p_gym uuid, p_to public.affiliation_status, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from public.affiliation_status;
begin
  select affiliation_status into v_from from public.gyms where id = p_gym for update;
  if v_from is null then
    raise exception 'Gimnasio no encontrado.' using errcode = 'P0002';
  end if;

  update public.gyms
     set affiliation_status = p_to,
         approved_at = case when p_to = 'approved' then coalesce(approved_at, now()) else approved_at end
   where id = p_gym;

  insert into public.affiliation_events (gym_id, from_status, to_status, actor_id, note)
  values (p_gym, v_from, p_to, auth.uid(), nullif(trim(coalesce(p_note, '')), ''));
  perform public.write_audit('gym.affiliation_status', 'gym', p_gym::text, p_gym,
    jsonb_build_object('from', v_from, 'to', p_to));
end;
$$;

-- El propietario envía la solicitud cuando los datos mínimos están completos.
create function public.submit_affiliation(p_gym uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gym public.gyms;
  v_det public.gym_business_details;
  v_missing text[] := '{}';
begin
  if not public.has_gym_role(p_gym, array['owner']::public.gym_role[]) then
    raise exception 'Solo el propietario puede enviar la solicitud.' using errcode = '42501';
  end if;

  select * into v_gym from public.gyms where id = p_gym for update;
  if v_gym.affiliation_status <> 'draft' then
    raise exception 'Solo se puede enviar una solicitud en borrador.' using errcode = '22023';
  end if;

  select * into v_det from public.gym_business_details where gym_id = p_gym;
  if v_det.legal_name is null then v_missing := v_missing || 'razón social'; end if;
  if v_det.rif is null then v_missing := v_missing || 'RIF'; end if;
  if v_det.contact_email is null and v_det.contact_phone is null then v_missing := v_missing || 'correo o teléfono de contacto'; end if;
  if not exists (select 1 from public.gym_locations where gym_id = p_gym) then v_missing := v_missing || 'al menos una sede'; end if;
  if v_gym.terms_accepted_at is null then v_missing := v_missing || 'aceptación de condiciones'; end if;

  if cardinality(v_missing) > 0 then
    raise exception 'Faltan datos: %', array_to_string(v_missing, ', ') using errcode = '22023';
  end if;

  perform public.apply_affiliation_transition(p_gym, 'submitted', null);
end;
$$;

-- Tras un rechazo, el propietario puede volver a borrador para corregir.
create function public.reopen_affiliation(p_gym uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_gym_role(p_gym, array['owner']::public.gym_role[]) then
    raise exception 'Solo el propietario puede reabrir la solicitud.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.gyms where id = p_gym and affiliation_status = 'rejected') then
    raise exception 'Solo se puede reabrir una solicitud rechazada.' using errcode = '22023';
  end if;
  perform public.apply_affiliation_transition(p_gym, 'draft', 'Reabierta por el propietario');
end;
$$;

-- Decisiones del administrador de Rutine.
create function public.admin_set_affiliation_status(p_gym uuid, p_to public.affiliation_status, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from public.affiliation_status;
  v_ok boolean;
begin
  if not public.is_super_admin() then
    raise exception 'Acción reservada a la administración de Rutine.' using errcode = '42501';
  end if;

  select affiliation_status into v_from from public.gyms where id = p_gym;
  if v_from is null then
    raise exception 'Gimnasio no encontrado.' using errcode = 'P0002';
  end if;

  v_ok := (v_from, p_to) in (
    ('submitted'::public.affiliation_status, 'under_review'::public.affiliation_status),
    ('under_review', 'approved'),
    ('under_review', 'rejected'),
    ('under_review', 'draft'),       -- solicitar correcciones
    ('approved', 'suspended'),
    ('suspended', 'approved')
  );
  if not v_ok then
    raise exception 'Transición no permitida: % → %', v_from, p_to using errcode = '22023';
  end if;

  if p_to in ('rejected', 'draft', 'suspended') and char_length(trim(coalesce(p_note, ''))) < 5 then
    raise exception 'Explica el motivo (mínimo 5 caracteres).' using errcode = '22023';
  end if;

  perform public.apply_affiliation_transition(p_gym, p_to, p_note);
end;
$$;

-- -----------------------------------------------------------------------------
-- Invitaciones de personal
-- -----------------------------------------------------------------------------
-- Devuelve el token en claro una sola vez; en la base solo queda su hash.
create function public.invite_staff(p_gym uuid, p_email text, p_role public.gym_role)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  if p_role = 'owner' then
    raise exception 'La propiedad no se transfiere por invitación.' using errcode = '22023';
  end if;
  if p_role = 'manager' and not public.has_gym_role(p_gym, array['owner']::public.gym_role[]) then
    raise exception 'Solo el propietario puede invitar administradores.' using errcode = '42501';
  end if;
  if not public.is_gym_admin(p_gym) then
    raise exception 'No tienes permiso para invitar personal en este gimnasio.' using errcode = '42501';
  end if;
  if not public.gym_is_public(p_gym) then
    raise exception 'El gimnasio debe estar aprobado para incorporar personal.' using errcode = '22023';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then
    raise exception 'Correo no válido.' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.gym_staff s join auth.users u on u.id = s.user_id
    where s.gym_id = p_gym and s.status = 'active' and lower(u.email) = v_email
  ) then
    raise exception 'Esa persona ya forma parte del personal.' using errcode = '23505';
  end if;

  -- Una sola invitación vigente por correo y gimnasio.
  update public.staff_invitations
     set revoked_at = now()
   where gym_id = p_gym and email = v_email and accepted_at is null and revoked_at is null;

  insert into public.staff_invitations (gym_id, email, role, token_hash, invited_by)
  values (p_gym, v_email, p_role, extensions.digest(v_token, 'sha256'), auth.uid());

  perform public.write_audit('staff.invite', 'staff_invitation', null, p_gym, jsonb_build_object('role', p_role));
  return v_token;
end;
$$;

create function public.accept_staff_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := auth.uid();
  v_email text;
  v_inv   public.staff_invitations;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión.' using errcode = '42501';
  end if;
  select lower(email) into v_email from auth.users where id = v_user;

  select * into v_inv from public.staff_invitations
   where token_hash = extensions.digest(coalesce(p_token, ''), 'sha256')
   for update;

  if v_inv.id is null or v_inv.revoked_at is not null or v_inv.accepted_at is not null or v_inv.expires_at < now() then
    raise exception 'La invitación no es válida o ha caducado.' using errcode = '22023';
  end if;
  if v_inv.email <> v_email then
    raise exception 'Esta invitación es para otra cuenta de correo.' using errcode = '42501';
  end if;
  if not public.gym_is_public(v_inv.gym_id) then
    raise exception 'El gimnasio no está activo.' using errcode = '22023';
  end if;

  insert into public.gym_staff (gym_id, user_id, role, invited_by)
  values (v_inv.gym_id, v_user, v_inv.role, v_inv.invited_by)
  on conflict (gym_id, user_id) do update
    set role = excluded.role, status = 'active', invited_by = excluded.invited_by
    where public.gym_staff.status = 'revoked';

  if not found then
    raise exception 'Ya formas parte del personal de este gimnasio.' using errcode = '23505';
  end if;

  update public.staff_invitations set accepted_at = now(), accepted_by = v_user where id = v_inv.id;
  perform public.write_audit('staff.accept', 'gym_staff', v_user::text, v_inv.gym_id, jsonb_build_object('role', v_inv.role));
  return v_inv.gym_id;
end;
$$;

create function public.revoke_staff(p_gym uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target public.gym_role;
begin
  select role into v_target from public.gym_staff where gym_id = p_gym and user_id = p_user and status = 'active';
  if v_target is null then
    raise exception 'Esa persona no forma parte del personal activo.' using errcode = 'P0002';
  end if;
  if v_target = 'owner' then
    raise exception 'No se puede retirar al propietario.' using errcode = '42501';
  end if;
  if not (
    public.has_gym_role(p_gym, array['owner']::public.gym_role[])
    or (public.has_gym_role(p_gym, array['manager']::public.gym_role[]) and v_target in ('receptionist', 'trainer'))
  ) then
    raise exception 'No tienes permiso para retirar a esta persona.' using errcode = '42501';
  end if;

  update public.gym_staff set status = 'revoked' where gym_id = p_gym and user_id = p_user;
  perform public.write_audit('staff.revoke', 'gym_staff', p_user::text, p_gym, jsonb_build_object('role', v_target));
end;
$$;

-- Espacios a los que puede entrar el usuario actual (para redirigir tras el login).
create function public.my_workspaces()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'platform_roles', coalesce((select jsonb_agg(role order by role) from public.user_roles where user_id = auth.uid()), '[]'::jsonb),
    'gyms', coalesce((
      select jsonb_agg(jsonb_build_object(
        'gym_id', g.id, 'trade_name', g.trade_name, 'slug', g.slug,
        'role', s.role, 'affiliation_status', g.affiliation_status
      ) order by g.trade_name)
      from public.gym_staff s join public.gyms g on g.id = s.gym_id
      where s.user_id = auth.uid() and s.status = 'active'
    ), '[]'::jsonb)
  );
$$;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.gyms enable row level security;
alter table public.gym_business_details enable row level security;
alter table public.gym_locations enable row level security;
alter table public.gym_staff enable row level security;
alter table public.staff_invitations enable row level security;
alter table public.affiliation_events enable row level security;

-- gyms: el público ve solo aprobados; el personal ve su gimnasio; el admin ve todo.
create policy gyms_select on public.gyms
  for select to anon, authenticated
  using (affiliation_status = 'approved' or public.is_gym_member(id) or public.is_super_admin());

create policy gyms_update on public.gyms
  for update to authenticated
  using (public.is_gym_admin(id) and affiliation_status in ('draft', 'approved'))
  with check (public.is_gym_admin(id));

-- Sin INSERT ni DELETE directos: se crean con create_gym().

create policy gym_business_select on public.gym_business_details
  for select to authenticated
  using (public.is_gym_admin(gym_id) or public.is_super_admin());

create policy gym_business_update on public.gym_business_details
  for update to authenticated
  using (public.is_gym_admin(gym_id) and public.gym_is_editable(gym_id))
  with check (public.is_gym_admin(gym_id));

create policy gym_locations_select on public.gym_locations
  for select to anon, authenticated
  using (public.gym_is_public(gym_id) or public.is_gym_member(gym_id) or public.is_super_admin());

create policy gym_locations_insert on public.gym_locations
  for insert to authenticated
  with check (public.is_gym_admin(gym_id) and public.gym_is_editable(gym_id));

create policy gym_locations_update on public.gym_locations
  for update to authenticated
  using (public.is_gym_admin(gym_id) and public.gym_is_editable(gym_id))
  with check (public.is_gym_admin(gym_id));

create policy gym_locations_delete on public.gym_locations
  for delete to authenticated
  using (public.is_gym_admin(gym_id) and public.gym_is_editable(gym_id));

create policy gym_staff_select on public.gym_staff
  for select to authenticated
  using (user_id = auth.uid() or public.is_gym_admin(gym_id) or public.is_super_admin());

create policy staff_invitations_select on public.staff_invitations
  for select to authenticated
  using (public.is_gym_admin(gym_id) or public.is_super_admin());

create policy affiliation_events_select on public.affiliation_events
  for select to authenticated
  using (public.is_gym_admin(gym_id) or public.is_super_admin());

-- El propietario puede leer la auditoría de su gimnasio.
create policy audit_logs_select_gym_owner on public.audit_logs
  for select to authenticated
  using (gym_id is not null and public.has_gym_role(gym_id, array['owner']::public.gym_role[]));

-- Compañeros de gimnasio: los administradores del gimnasio ven el nombre de su personal.
create policy profiles_select_staff on public.profiles
  for select to authenticated
  using (exists (
    select 1 from public.gym_staff s
    where s.user_id = profiles.id and public.is_gym_admin(s.gym_id)
  ));
