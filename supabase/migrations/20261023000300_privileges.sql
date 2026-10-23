-- =============================================================================
-- Rutine · 0300 · Privilegios explícitos (defensa en profundidad)
-- =============================================================================
-- Supabase concede por defecto EXECUTE sobre funciones y privilegios de tabla
-- a anon y authenticated. RLS ya filtra las filas, pero aquí se retira todo lo
-- que no hace falta para que un error futuro en una política no abra datos.
-- =============================================================================

-- Funciones -------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

-- Las nuevas funciones tampoco quedarán abiertas por defecto.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Funciones de permisos usadas dentro de políticas (responden por el usuario actual).
grant execute on function
  public.is_super_admin(),
  public.has_gym_role(uuid, public.gym_role[]),
  public.is_gym_member(uuid),
  public.is_gym_admin(uuid),
  public.gym_is_editable(uuid),
  public.gym_is_public(uuid)
to anon, authenticated;

-- Operaciones de negocio para usuarios autenticados (cada una valida sus permisos).
grant execute on function
  public.create_gym(text),
  public.accept_affiliation_terms(uuid, text),
  public.submit_affiliation(uuid),
  public.reopen_affiliation(uuid),
  public.admin_set_affiliation_status(uuid, public.affiliation_status, text),
  public.invite_staff(uuid, text, public.gym_role),
  public.accept_staff_invitation(text),
  public.revoke_staff(uuid, uuid),
  public.my_workspaces()
to authenticated;

-- Solo para el panel de Supabase / clave de servicio.
grant execute on function public.bootstrap_super_admin(text) to service_role;

-- Internas (sin concesión): write_audit, apply_affiliation_transition, slugify,
-- handle_new_user y funciones de trigger.

-- Tablas ----------------------------------------------------------------------
revoke all on all tables in schema public from anon;
grant select on public.gyms, public.gym_locations to anon;

-- Tablas que nunca se escriben directamente desde el cliente.
revoke insert, update, delete, truncate on
  public.user_roles,
  public.audit_logs,
  public.affiliation_events,
  public.gym_staff,
  public.staff_invitations
from authenticated;

revoke insert, delete, truncate on
  public.profiles,
  public.gyms,
  public.gym_business_details
from authenticated;

revoke truncate on all tables in schema public from authenticated;
