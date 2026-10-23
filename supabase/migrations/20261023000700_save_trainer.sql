-- =============================================================================
-- Rutine · 0700 · Guardado atómico de la ficha de entrenador
-- =============================================================================
-- Una sola llamada guarda datos, sedes, disponibilidad y certificaciones en una
-- transacción: o se guarda todo o nada. Los triggers de 0400 siguen validando
-- que sedes y horarios pertenezcan al mismo gimnasio.
--
-- p_data (jsonb):
-- { full_name, headline, bio, specialties: [text], experience_years, is_public,
--   status, photo_path?, location_ids: [uuid],
--   availability: [{ location_id, weekday, starts_at, ends_at }],
--   certifications: [{ id?, name, issuer, year, verified: bool }] }
-- =============================================================================

create function public.save_trainer(p_gym uuid, p_trainer uuid, p_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id      uuid := p_trainer;
  v_status  public.trainer_status := coalesce(p_data ->> 'status', 'active')::public.trainer_status;
  v_public  boolean := coalesce((p_data ->> 'is_public')::boolean, false);
  v_cert    jsonb;
  v_keep    uuid[] := '{}';
  v_old     public.trainer_certifications;
  v_cert_id uuid;
begin
  if not (public.is_gym_admin(p_gym) and public.gym_is_editable(p_gym)) then
    raise exception 'No tienes permiso para administrar entrenadores en este gimnasio.' using errcode = '42501';
  end if;
  if v_public and v_status <> 'active' then
    raise exception 'Un perfil inactivo no puede ser público.' using errcode = '22023';
  end if;

  if v_id is null then
    v_id := public.create_trainer(p_gym, p_data ->> 'full_name');
  elsif public.trainer_gym_id(v_id) is distinct from p_gym then
    raise exception 'Entrenador no encontrado en este gimnasio.' using errcode = 'P0002';
  end if;

  update public.trainers set
    full_name        = trim(p_data ->> 'full_name'),
    headline         = nullif(trim(coalesce(p_data ->> 'headline', '')), ''),
    bio              = nullif(trim(coalesce(p_data ->> 'bio', '')), ''),
    specialties      = coalesce(array(select jsonb_array_elements_text(p_data -> 'specialties')), '{}'),
    experience_years = nullif(p_data ->> 'experience_years', '')::smallint,
    is_public        = v_public,
    status           = v_status,
    photo_path       = case when p_data ? 'photo_path' then nullif(p_data ->> 'photo_path', '') else photo_path end
  where id = v_id;

  -- Sedes y disponibilidad: se reemplazan por lo enviado.
  delete from public.trainer_availability where trainer_id = v_id;
  delete from public.trainer_locations where trainer_id = v_id;
  insert into public.trainer_locations (trainer_id, location_id)
  select v_id, x::uuid from jsonb_array_elements_text(coalesce(p_data -> 'location_ids', '[]')) x;
  insert into public.trainer_availability (trainer_id, location_id, weekday, starts_at, ends_at)
  select v_id, (a ->> 'location_id')::uuid, (a ->> 'weekday')::smallint, (a ->> 'starts_at')::time, (a ->> 'ends_at')::time
  from jsonb_array_elements(coalesce(p_data -> 'availability', '[]')) a;

  -- Certificaciones: actualizar las existentes, crear las nuevas, borrar las retiradas.
  for v_cert in select * from jsonb_array_elements(coalesce(p_data -> 'certifications', '[]')) loop
    v_cert_id := nullif(v_cert ->> 'id', '')::uuid;
    select * into v_old from public.trainer_certifications where id = v_cert_id and trainer_id = v_id;
    if v_old.id is null then
      insert into public.trainer_certifications (trainer_id, name, issuer, year, verified_at)
      values (v_id, trim(v_cert ->> 'name'), nullif(trim(coalesce(v_cert ->> 'issuer', '')), ''),
              nullif(v_cert ->> 'year', '')::smallint,
              case when coalesce((v_cert ->> 'verified')::boolean, false) then now() end)
      returning id into v_cert_id;
    else
      update public.trainer_certifications set
        name = trim(v_cert ->> 'name'),
        issuer = nullif(trim(coalesce(v_cert ->> 'issuer', '')), ''),
        year = nullif(v_cert ->> 'year', '')::smallint,
        verified_at = case
          when not coalesce((v_cert ->> 'verified')::boolean, false) then null
          when v_old.verified_at is not null
               and v_old.name = trim(v_cert ->> 'name')
               and v_old.issuer is not distinct from nullif(trim(coalesce(v_cert ->> 'issuer', '')), '')
               and v_old.year is not distinct from nullif(v_cert ->> 'year', '')::smallint
            then v_old.verified_at
          else now() end,
        verified_by = case
          when not coalesce((v_cert ->> 'verified')::boolean, false) then null
          else coalesce(v_old.verified_by, auth.uid()) end
      where id = v_old.id;
    end if;
    v_keep := v_keep || v_cert_id;
  end loop;
  delete from public.trainer_certifications where trainer_id = v_id and not (id = any (v_keep));

  perform public.write_audit('trainer.save', 'trainer', v_id::text, p_gym,
    jsonb_build_object('is_public', v_public, 'status', v_status));
  return v_id;
end;
$$;

revoke execute on function public.save_trainer(uuid, uuid, jsonb) from public, anon;
grant execute on function public.save_trainer(uuid, uuid, jsonb) to authenticated;
