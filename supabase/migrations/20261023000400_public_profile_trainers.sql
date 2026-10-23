-- =============================================================================
-- Rutine · 0400 · Perfil público del gimnasio y entrenadores por gimnasio
-- =============================================================================
-- Los entrenadores NO son un directorio global: cada ficha pertenece a un
-- gimnasio (trainers.gym_id). Si una persona trabaja en dos gimnasios, tiene
-- dos fichas, una por gimnasio, cada una administrada por ese gimnasio.
-- La asignación a sedes es explícita (trainer_locations).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Datos públicos del gimnasio
-- -----------------------------------------------------------------------------
alter table public.gyms
  add column amenities text[] not null default '{}' check (cardinality(amenities) <= 40),
  add column services  text[] not null default '{}' check (cardinality(services) <= 40);

create table public.gym_photos (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references public.gyms (id) on delete cascade,
  storage_path  text not null check (char_length(storage_path) <= 300),
  alt_text      text not null check (char_length(alt_text) between 3 and 160),
  sort_order    smallint not null default 0,
  created_at    timestamptz not null default now()
);
create index gym_photos_gym_idx on public.gym_photos (gym_id, sort_order);

-- Horario de atención por sede (día ISO: 1 = lunes … 7 = domingo).
create table public.gym_opening_hours (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references public.gym_locations (id) on delete cascade,
  weekday      smallint not null check (weekday between 1 and 7),
  opens_at     time not null,
  closes_at    time not null check (closes_at > opens_at),
  unique (location_id, weekday, opens_at)
);

create type public.plan_kind as enum
  ('enrollment', 'monthly', 'quarterly', 'semiannual', 'annual', 'single_class', 'custom');

-- Planes y precios publicados. Las membresías contratadas llegan en la fase 3.
create table public.membership_plans (
  id             uuid primary key default gen_random_uuid(),
  gym_id         uuid not null references public.gyms (id) on delete cascade,
  name           text not null check (char_length(trim(name)) between 2 and 80),
  kind           public.plan_kind not null,
  price_amount   numeric(12, 2) not null check (price_amount >= 0),
  currency       text not null default 'USD' check (currency in ('USD', 'VES')),
  duration_days  integer check (duration_days is null or duration_days between 1 and 730),
  description    text check (description is null or char_length(description) <= 600),
  is_public      boolean not null default true,
  is_active      boolean not null default true,
  sort_order     smallint not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index membership_plans_gym_idx on public.membership_plans (gym_id, sort_order);

create trigger membership_plans_touch before update on public.membership_plans
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Entrenadores
-- -----------------------------------------------------------------------------
create type public.trainer_status as enum ('active', 'inactive');

create table public.trainers (
  id                uuid primary key default gen_random_uuid(),
  gym_id            uuid not null references public.gyms (id) on delete cascade,
  slug              text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  full_name         text not null check (char_length(trim(full_name)) between 3 and 100),
  headline          text check (headline is null or char_length(headline) <= 120),
  bio               text check (bio is null or char_length(bio) <= 1500),
  specialties       text[] not null default '{}' check (cardinality(specialties) <= 12),
  experience_years  smallint check (experience_years is null or experience_years between 0 and 60),
  photo_path        text check (photo_path is null or char_length(photo_path) <= 300),
  is_public         boolean not null default false,
  status            public.trainer_status not null default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (gym_id, slug)
);
create index trainers_gym_idx on public.trainers (gym_id) where status = 'active';

create trigger trainers_touch before update on public.trainers
  for each row execute function public.touch_updated_at();

-- Vínculo privado con una cuenta de usuario (no visible para el público).
create table public.trainer_accounts (
  trainer_id         uuid primary key references public.trainers (id) on delete cascade,
  user_id            uuid not null references auth.users (id) on delete cascade,
  self_edit_allowed  boolean not null default false
);
create unique index trainer_accounts_user_per_gym on public.trainer_accounts (user_id, trainer_id);

create table public.trainer_certifications (
  id           uuid primary key default gen_random_uuid(),
  trainer_id   uuid not null references public.trainers (id) on delete cascade,
  name         text not null check (char_length(trim(name)) between 2 and 120),
  issuer       text check (issuer is null or char_length(issuer) <= 120),
  year         smallint check (year is null or year between 1950 and 2100),
  verified_at  timestamptz,
  verified_by  uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
comment on column public.trainer_certifications.verified_at is
  'Marcada por un administrador del gimnasio tras revisar el documento. Se muestra como "Verificada por el gimnasio", no como verificación de Rutine.';

create table public.trainer_locations (
  trainer_id   uuid not null references public.trainers (id) on delete cascade,
  location_id  uuid not null references public.gym_locations (id) on delete cascade,
  primary key (trainer_id, location_id)
);

create table public.trainer_availability (
  id           uuid primary key default gen_random_uuid(),
  trainer_id   uuid not null references public.trainers (id) on delete cascade,
  location_id  uuid not null references public.gym_locations (id) on delete cascade,
  weekday      smallint not null check (weekday between 1 and 7),
  starts_at    time not null,
  ends_at      time not null check (ends_at > starts_at),
  unique (trainer_id, location_id, weekday, starts_at)
);
create index trainer_availability_trainer_idx on public.trainer_availability (trainer_id, weekday);

-- -----------------------------------------------------------------------------
-- Funciones de pertenencia
-- -----------------------------------------------------------------------------
create function public.location_gym_id(p_location uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select gym_id from public.gym_locations where id = p_location;
$$;

create function public.trainer_gym_id(p_trainer uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select gym_id from public.trainers where id = p_trainer;
$$;

-- ¿Puede el usuario actual ver esta ficha de entrenador?
create function public.trainer_is_visible(p_trainer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trainers t
    where t.id = p_trainer
      and ((t.is_public and t.status = 'active' and public.gym_is_public(t.gym_id))
           or public.is_gym_member(t.gym_id)
           or public.is_super_admin())
  );
$$;

-- ¿Puede administrarla? (administrador del gimnasio en un estado editable)
create function public.trainer_is_manageable(p_trainer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_gym_admin(gid) and public.gym_is_editable(gid)
  from (select public.trainer_gym_id(p_trainer) as gid) x;
$$;

-- ¿Es el propio entrenador con permiso de autoedición concedido por el gimnasio?
create function public.trainer_is_self_editable(p_trainer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trainer_accounts a
    join public.trainers t on t.id = a.trainer_id
    join public.gym_staff s on s.gym_id = t.gym_id and s.user_id = a.user_id and s.status = 'active'
    where a.trainer_id = p_trainer and a.user_id = auth.uid() and a.self_edit_allowed
  );
$$;

-- -----------------------------------------------------------------------------
-- Integridad entre gimnasios: una sede o cuenta nunca cruza de gimnasio
-- -----------------------------------------------------------------------------
create function public.check_same_gym_location()
returns trigger language plpgsql set search_path = '' as $$
begin
  if public.location_gym_id(new.location_id) is distinct from public.trainer_gym_id(new.trainer_id) then
    raise exception 'La sede no pertenece al gimnasio del entrenador.' using errcode = '23514';
  end if;
  if tg_table_name = 'trainer_availability' and not exists (
    select 1 from public.trainer_locations where trainer_id = new.trainer_id and location_id = new.location_id
  ) then
    raise exception 'Primero asigna el entrenador a esa sede.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger trainer_locations_same_gym before insert or update on public.trainer_locations
  for each row execute function public.check_same_gym_location();
create trigger trainer_availability_same_gym before insert or update on public.trainer_availability
  for each row execute function public.check_same_gym_location();

create function public.check_trainer_account()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.gym_staff
    where gym_id = public.trainer_gym_id(new.trainer_id) and user_id = new.user_id
      and role = 'trainer' and status = 'active'
  ) then
    raise exception 'La cuenta debe ser personal activo con rol de entrenador en este gimnasio.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger trainer_accounts_check before insert or update on public.trainer_accounts
  for each row execute function public.check_trainer_account();

-- Lo que un entrenador NO puede cambiar de su propia ficha.
create function public.trainers_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.gym_id is distinct from old.gym_id then
    raise exception 'Una ficha no puede moverse a otro gimnasio.' using errcode = '42501';
  end if;
  if current_user in ('anon', 'authenticated') and not public.is_gym_admin(old.gym_id)
     and (new.slug is distinct from old.slug or new.is_public is distinct from old.is_public
          or new.status is distinct from old.status) then
    raise exception 'Solo el gimnasio puede cambiar la visibilidad o el estado de la ficha.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger trainers_guard before update on public.trainers
  for each row execute function public.trainers_guard();

create function public.certifications_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.trainer_id is distinct from old.trainer_id then
    raise exception 'Una certificación no cambia de entrenador.' using errcode = '42501';
  end if;
  if current_user in ('anon', 'authenticated') and not public.is_gym_admin(public.trainer_gym_id(new.trainer_id)) then
    -- El propio entrenador puede añadir certificaciones, pero no marcarlas como verificadas.
    if tg_op = 'INSERT' then
      new.verified_at := null; new.verified_by := null;
    elsif new.verified_at is distinct from old.verified_at or new.verified_by is distinct from old.verified_by then
      raise exception 'Solo el gimnasio verifica certificaciones.' using errcode = '42501';
    elsif new.name is distinct from old.name or new.issuer is distinct from old.issuer or new.year is distinct from old.year then
      new.verified_at := null; new.verified_by := null;  -- cambiar el contenido invalida la verificación
    end if;
  elsif new.verified_at is not null and (tg_op = 'INSERT' or old.verified_at is null) then
    new.verified_by := auth.uid();
  end if;
  return new;
end;
$$;

create trigger trainer_certifications_guard before insert or update on public.trainer_certifications
  for each row execute function public.certifications_guard();

-- Alta de entrenador con slug único dentro del gimnasio y auditoría.
create function public.create_trainer(p_gym uuid, p_full_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id   uuid := gen_random_uuid();
  v_base text := coalesce(nullif(public.slugify(p_full_name), ''), 'entrenador');
  v_slug text := v_base;
  v_n    int := 1;
begin
  if not (public.is_gym_admin(p_gym) and public.gym_is_editable(p_gym)) then
    raise exception 'No tienes permiso para registrar entrenadores en este gimnasio.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_full_name, ''))) not between 3 and 100 then
    raise exception 'El nombre debe tener entre 3 y 100 caracteres.' using errcode = '22023';
  end if;
  while exists (select 1 from public.trainers where gym_id = p_gym and slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  insert into public.trainers (id, gym_id, slug, full_name) values (v_id, p_gym, v_slug, trim(p_full_name));
  perform public.write_audit('trainer.create', 'trainer', v_id::text, p_gym, '{}'::jsonb);
  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.gym_photos enable row level security;
alter table public.gym_opening_hours enable row level security;
alter table public.membership_plans enable row level security;
alter table public.trainers enable row level security;
alter table public.trainer_accounts enable row level security;
alter table public.trainer_certifications enable row level security;
alter table public.trainer_locations enable row level security;
alter table public.trainer_availability enable row level security;

-- Fotos
create policy gym_photos_select on public.gym_photos for select to anon, authenticated
  using (public.gym_is_public(gym_id) or public.is_gym_member(gym_id) or public.is_super_admin());
create policy gym_photos_write on public.gym_photos for all to authenticated
  using (public.is_gym_admin(gym_id) and public.gym_is_editable(gym_id))
  with check (public.is_gym_admin(gym_id) and public.gym_is_editable(gym_id));

-- Horarios
create policy opening_hours_select on public.gym_opening_hours for select to anon, authenticated
  using (public.gym_is_public(public.location_gym_id(location_id))
         or public.is_gym_member(public.location_gym_id(location_id)) or public.is_super_admin());
create policy opening_hours_write on public.gym_opening_hours for all to authenticated
  using (public.is_gym_admin(public.location_gym_id(location_id)) and public.gym_is_editable(public.location_gym_id(location_id)))
  with check (public.is_gym_admin(public.location_gym_id(location_id)) and public.gym_is_editable(public.location_gym_id(location_id)));

-- Planes
create policy plans_select on public.membership_plans for select to anon, authenticated
  using ((is_public and is_active and public.gym_is_public(gym_id)) or public.is_gym_member(gym_id) or public.is_super_admin());
create policy plans_write on public.membership_plans for all to authenticated
  using (public.is_gym_admin(gym_id) and public.gym_is_editable(gym_id))
  with check (public.is_gym_admin(gym_id) and public.gym_is_editable(gym_id));

-- Entrenadores
create policy trainers_select on public.trainers for select to anon, authenticated
  using (public.trainer_is_visible(id));
create policy trainers_update on public.trainers for update to authenticated
  using (public.trainer_is_manageable(id) or public.trainer_is_self_editable(id))
  with check (public.trainer_is_manageable(id) or public.trainer_is_self_editable(id));
create policy trainers_delete on public.trainers for delete to authenticated
  using (public.trainer_is_manageable(id));
-- Alta solo con create_trainer().

create policy trainer_accounts_select on public.trainer_accounts for select to authenticated
  using (user_id = auth.uid() or public.is_gym_admin(public.trainer_gym_id(trainer_id)) or public.is_super_admin());
create policy trainer_accounts_write on public.trainer_accounts for all to authenticated
  using (public.trainer_is_manageable(trainer_id))
  with check (public.trainer_is_manageable(trainer_id));

create policy certifications_select on public.trainer_certifications for select to anon, authenticated
  using (public.trainer_is_visible(trainer_id));
create policy certifications_write on public.trainer_certifications for all to authenticated
  using (public.trainer_is_manageable(trainer_id) or public.trainer_is_self_editable(trainer_id))
  with check (public.trainer_is_manageable(trainer_id) or public.trainer_is_self_editable(trainer_id));

create policy trainer_locations_select on public.trainer_locations for select to anon, authenticated
  using (public.trainer_is_visible(trainer_id));
create policy trainer_locations_write on public.trainer_locations for all to authenticated
  using (public.trainer_is_manageable(trainer_id))
  with check (public.trainer_is_manageable(trainer_id));

create policy trainer_availability_select on public.trainer_availability for select to anon, authenticated
  using (public.trainer_is_visible(trainer_id));
create policy trainer_availability_write on public.trainer_availability for all to authenticated
  using (public.trainer_is_manageable(trainer_id))
  with check (public.trainer_is_manageable(trainer_id));

-- -----------------------------------------------------------------------------
-- Privilegios
-- -----------------------------------------------------------------------------
revoke all on public.gym_photos, public.gym_opening_hours, public.membership_plans, public.trainers,
  public.trainer_accounts, public.trainer_certifications, public.trainer_locations, public.trainer_availability
from anon;
grant select on public.gym_photos, public.gym_opening_hours, public.membership_plans, public.trainers,
  public.trainer_certifications, public.trainer_locations, public.trainer_availability
to anon;

revoke insert, truncate on public.trainers from authenticated;
revoke truncate on public.gym_photos, public.gym_opening_hours, public.membership_plans,
  public.trainer_accounts, public.trainer_certifications, public.trainer_locations, public.trainer_availability
from authenticated;

-- Las tablas futuras tampoco quedarán abiertas al público por defecto.
alter default privileges in schema public revoke all on tables from anon;

grant execute on function
  public.location_gym_id(uuid),
  public.trainer_gym_id(uuid),
  public.trainer_is_visible(uuid),
  public.trainer_is_manageable(uuid),
  public.trainer_is_self_editable(uuid)
to anon, authenticated;
grant execute on function public.create_trainer(uuid, text) to authenticated;
