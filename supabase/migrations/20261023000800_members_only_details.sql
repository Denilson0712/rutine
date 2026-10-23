-- =============================================================================
-- Rutine · 0800 · Precios y entrenadores solo con sesión
-- =============================================================================
-- Decisión de producto: el visitante anónimo ve lo básico del gimnasio
-- (nombre, ubicación, descripción, horarios, fotos). Los precios y el equipo
-- de entrenadores se ven tras iniciar sesión.
-- Se aplica en la base de datos, no solo ocultando elementos en React.
-- =============================================================================

-- Planes: solo usuarios autenticados.
drop policy plans_select on public.membership_plans;
create policy plans_select on public.membership_plans for select to authenticated
  using ((is_public and is_active and public.gym_is_public(gym_id)) or public.is_gym_member(gym_id) or public.is_super_admin());

-- Entrenadores: la vía pública exige sesión iniciada.
create or replace function public.trainer_is_visible(p_trainer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trainers t
    where t.id = p_trainer
      and ((auth.uid() is not null and t.is_public and t.status = 'active' and public.gym_is_public(t.gym_id))
           or public.is_gym_member(t.gym_id)
           or public.is_super_admin())
  );
$$;

revoke select on public.membership_plans, public.trainers, public.trainer_certifications,
  public.trainer_locations, public.trainer_availability
from anon;

-- Las políticas ya no aplican a anon.
alter policy trainers_select on public.trainers to authenticated;
alter policy certifications_select on public.trainer_certifications to authenticated;
alter policy trainer_locations_select on public.trainer_locations to authenticated;
alter policy trainer_availability_select on public.trainer_availability to authenticated;
