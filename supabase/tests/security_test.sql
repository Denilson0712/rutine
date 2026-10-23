-- =============================================================================
-- Pruebas de seguridad y reglas de negocio · Fase 2
-- Se ejecutan como superusuario y cambian de rol para simular cada actor.
-- Cualquier fallo detiene el script (ON_ERROR_STOP) con un mensaje claro.
-- =============================================================================
\set ON_ERROR_STOP on
set client_min_messages = warning;

create schema t;
grant usage on schema t to anon, authenticated, service_role;

create table t.results (n serial, name text, ok boolean);
grant insert, select on t.results to anon, authenticated, service_role;
grant usage on sequence t.results_n_seq to anon, authenticated, service_role;

-- Afirmación simple.
create function t.ok(p_cond boolean, p_name text) returns void language plpgsql as $$
begin
  insert into t.results (name, ok) values (p_name, coalesce(p_cond, false));
  if not coalesce(p_cond, false) then
    raise exception 'FALLÓ: %', p_name;
  end if;
end $$;

-- Espera que una sentencia falle (por permisos, validación o RLS).
create function t.fails(p_sql text, p_name text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    insert into t.results (name, ok) values (p_name, true);
    return;
  end;
  insert into t.results (name, ok) values (p_name, false);
  raise exception 'FALLÓ (debía rechazarse): %', p_name;
end $$;

-- Cuenta filas visibles para el rol actual.
create function t.count(p_sql text) returns bigint language plpgsql as $$
declare v bigint;
begin
  execute 'select count(*) from (' || p_sql || ') q' into v;
  return v;
end $$;

grant execute on all functions in schema t to anon, authenticated, service_role;

-- Actúa como un usuario autenticado concreto (o anónimo si p_user es null).
create function t.act_as(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', coalesce(json_build_object('sub', p_user)::text, '{}'), false);
end $$;

-- -----------------------------------------------------------------------------
-- Usuarios de prueba
-- -----------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@rutine.test',   '{"full_name":"Admin"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'duena@gym-a.test',    '{"full_name":"Dueña A","role":"super_admin"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'dueno@gym-b.test',    '{"full_name":"Dueño B"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'recepcion@gym-a.test','{"full_name":"Recepción A"}'),
  ('00000000-0000-0000-0000-0000000000c1', 'atleta@correo.test',  '{"full_name":"Atleta"}');

-- Alta automática: perfil + rol atleta, ignorando el "role" inyectado en metadatos.
select t.ok((select count(*) from public.profiles) = 5, 'cada alta crea un perfil');
select t.ok((select count(*) from public.user_roles where role = 'athlete') = 5, 'cada alta recibe solo el rol atleta');
select t.ok(not exists (select 1 from public.user_roles where role = 'super_admin'), 'los metadatos del registro no conceden super_admin');

-- Bootstrap del primer administrador (como service_role).
set role service_role;
select public.bootstrap_super_admin('admin@rutine.test');
select t.fails($$select public.bootstrap_super_admin('duena@gym-a.test')$$, 'bootstrap solo funciona una vez');
reset role;

set role authenticated;
select t.act_as('00000000-0000-0000-0000-0000000000c1');
select t.fails($$select public.bootstrap_super_admin('atleta@correo.test')$$, 'un usuario no puede ejecutar bootstrap');

-- -----------------------------------------------------------------------------
-- Escalamiento de privilegios
-- -----------------------------------------------------------------------------
select t.fails($$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000c1', 'super_admin')$$,
  'un atleta no puede asignarse super_admin');
select t.fails($$update public.user_roles set role = 'super_admin' where user_id = '00000000-0000-0000-0000-0000000000c1'$$,
  'un atleta no puede cambiar su rol');
select t.ok(t.count('select 1 from public.user_roles') = 1, 'un usuario solo ve sus propios roles');
select t.ok(t.count('select 1 from public.profiles') = 1, 'un usuario solo ve su propio perfil');
update public.profiles set full_name = 'Atleta Editado' where id = '00000000-0000-0000-0000-0000000000a1';
reset role;
select t.ok((select full_name from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') = 'Dueña A',
  'no se puede editar el perfil de otra persona');
set role authenticated;
select t.act_as('00000000-0000-0000-0000-0000000000c1');
select t.fails($$select public.write_audit('x','x',null,null,'{}')$$, 'los usuarios no pueden escribir auditoría directamente');
select t.fails($$select public.apply_affiliation_transition(gen_random_uuid(), 'approved', null)$$, 'función interna de transición no expuesta');

-- -----------------------------------------------------------------------------
-- Creación de gimnasios y aislamiento
-- -----------------------------------------------------------------------------
select t.act_as('00000000-0000-0000-0000-0000000000a1');
select set_config('t.gym_a', public.create_gym('Gimnasio Ávila Fuerza')::text, false);
select t.ok((select role from public.gym_staff where gym_id = current_setting('t.gym_a')::uuid) = 'owner', 'quien crea el gimnasio es su propietaria');
select t.ok((select slug from public.gyms where id = current_setting('t.gym_a')::uuid) like 'gimnasio-avila-fuerza-%', 'slug generado sin acentos');
select t.fails($$insert into public.gyms (slug, trade_name, created_by) values ('x', 'Directo', auth.uid())$$, 'no se insertan gimnasios sin create_gym');

select t.act_as('00000000-0000-0000-0000-0000000000b1');
select set_config('t.gym_b', public.create_gym('Box Valencia')::text, false);
select t.ok(t.count('select 1 from public.gyms') = 1, 'el dueño B solo ve su gimnasio');
select t.ok(t.count(format('select 1 from public.gym_business_details where gym_id = %L', current_setting('t.gym_a'))) = 0,
  'el dueño B no ve los datos comerciales del gimnasio A');
update public.gyms set trade_name = 'Hackeado' where id = current_setting('t.gym_a')::uuid;
select t.fails(format($$insert into public.gym_locations (gym_id, name, state, city) values (%L, 'Intrusa', 'Lara', 'Barquisimeto')$$, current_setting('t.gym_a')),
  'el dueño B no puede crear sedes en el gimnasio A');
select t.fails(format($$select public.submit_affiliation(%L)$$, current_setting('t.gym_a')), 'el dueño B no puede enviar la solicitud de A');
reset role;
select t.ok((select trade_name from public.gyms where id = current_setting('t.gym_a')::uuid) = 'Gimnasio Ávila Fuerza',
  'el dueño B no puede renombrar el gimnasio A');

set role anon;
select t.act_as(null);
select t.ok(t.count('select 1 from public.gyms') = 0, 'el público no ve gimnasios en borrador');
select t.fails($$select * from public.gym_business_details$$, 'el público no accede a datos comerciales');
select t.fails($$select public.create_gym('Anónimo')$$, 'el público no puede crear gimnasios');
reset role;

-- -----------------------------------------------------------------------------
-- Flujo de afiliación
-- -----------------------------------------------------------------------------
set role authenticated;
select t.act_as('00000000-0000-0000-0000-0000000000a1');
select t.fails(format($$update public.gyms set affiliation_status = 'approved' where id = %L$$, current_setting('t.gym_a')),
  'la dueña no puede aprobarse cambiando el estado');
select t.fails(format($$select public.admin_set_affiliation_status(%L, 'approved')$$, current_setting('t.gym_a')),
  'la dueña no puede usar funciones de administración');
select t.fails(format($$select public.submit_affiliation(%L)$$, current_setting('t.gym_a')),
  'no se envía una solicitud incompleta');

update public.gym_business_details
   set legal_name = 'Ávila Fuerza C.A.', rif = 'J-12345678-9', contact_email = 'contacto@gym-a.test'
 where gym_id = current_setting('t.gym_a')::uuid;
insert into public.gym_locations (gym_id, name, state, city, is_primary)
values (current_setting('t.gym_a')::uuid, 'Sede Chacao', 'Miranda', 'Caracas', true);
select t.fails(format($$update public.gym_business_details set rif = 'ABC' where gym_id = %L$$, current_setting('t.gym_a')),
  'el RIF se valida en la base de datos');
select public.accept_affiliation_terms(current_setting('t.gym_a')::uuid, '2026-10');
select public.submit_affiliation(current_setting('t.gym_a')::uuid);
select t.ok((select affiliation_status from public.gyms where id = current_setting('t.gym_a')::uuid) = 'submitted', 'solicitud enviada');

update public.gym_business_details set legal_name = 'Cambio en revisión' where gym_id = current_setting('t.gym_a')::uuid;
select t.ok((select legal_name from public.gym_business_details where gym_id = current_setting('t.gym_a')::uuid) = 'Ávila Fuerza C.A.',
  'los datos comerciales se congelan mientras la solicitud está enviada');

-- Administrador
select t.act_as('00000000-0000-0000-0000-00000000000a');
select t.ok(t.count('select 1 from public.gyms') = 2, 'el administrador ve todos los gimnasios');
select t.fails(format($$select public.admin_set_affiliation_status(%L, 'approved')$$, current_setting('t.gym_a')),
  'no se puede saltar de enviada a aprobada');
select public.admin_set_affiliation_status(current_setting('t.gym_a')::uuid, 'under_review');
select t.fails(format($$select public.admin_set_affiliation_status(%L, 'rejected', '')$$, current_setting('t.gym_a')),
  'rechazar exige un motivo');
select public.admin_set_affiliation_status(current_setting('t.gym_a')::uuid, 'approved', 'Documentación revisada');
select t.ok((select approved_at is not null from public.gyms where id = current_setting('t.gym_a')::uuid), 'se registra la fecha de aprobación');
select t.ok(t.count(format('select 1 from public.affiliation_events where gym_id = %L', current_setting('t.gym_a'))) = 4,
  'historial: borrador, enviada, en revisión, aprobada');
select t.ok(t.count($$select 1 from public.audit_logs where action = 'gym.affiliation_status'$$) = 3, 'cada decisión queda auditada');
reset role;

set role anon;
select t.act_as(null);
select t.ok(t.count('select 1 from public.gyms') = 1, 'el público ve el gimnasio aprobado');
select t.ok(t.count('select 1 from public.gym_locations') = 1, 'el público ve la sede del gimnasio aprobado');
reset role;

-- -----------------------------------------------------------------------------
-- Personal e invitaciones
-- -----------------------------------------------------------------------------
set role authenticated;
select t.act_as('00000000-0000-0000-0000-0000000000b1');
select t.fails(format($$select public.invite_staff(%L, 'x@y.test', 'trainer')$$, current_setting('t.gym_b')),
  'un gimnasio no aprobado no puede incorporar personal');
select t.fails(format($$select public.invite_staff(%L, 'x@y.test', 'trainer')$$, current_setting('t.gym_a')),
  'un dueño no puede invitar personal a otro gimnasio');

select t.act_as('00000000-0000-0000-0000-0000000000a1');
select t.fails(format($$select public.invite_staff(%L, 'otro@y.test', 'owner')$$, current_setting('t.gym_a')),
  'no se invita como propietario');
select set_config('t.token', public.invite_staff(current_setting('t.gym_a')::uuid, 'Recepcion@gym-a.test', 'receptionist'), false);
select t.ok(not exists (select 1 from public.staff_invitations where token_hash::text like '%' || current_setting('t.token') || '%'),
  'el token no se guarda en claro');

select t.act_as('00000000-0000-0000-0000-0000000000c1');
select t.fails(format($$select public.accept_staff_invitation(%L)$$, current_setting('t.token')),
  'otra cuenta no puede usar la invitación');
select t.fails($$select public.accept_staff_invitation('token-falso')$$, 'un token inventado no sirve');

select t.act_as('00000000-0000-0000-0000-0000000000a2');
select public.accept_staff_invitation(current_setting('t.token'));
select t.ok((select role from public.gym_staff where user_id = auth.uid()) = 'receptionist', 'la invitación correcta incorpora a la recepcionista');
select t.fails(format($$select public.accept_staff_invitation(%L)$$, current_setting('t.token')), 'una invitación no se reutiliza');
select t.ok(t.count('select 1 from public.gyms') = 1, 'la recepcionista ve su gimnasio');
select t.ok(t.count('select 1 from public.gym_business_details') = 0, 'la recepcionista no ve datos comerciales');
select t.ok(t.count('select 1 from public.gym_staff') = 1, 'la recepcionista solo ve su propia ficha de personal');
select t.fails(format($$select public.invite_staff(%L, 'z@y.test', 'trainer')$$, current_setting('t.gym_a')),
  'la recepcionista no puede invitar personal');
select t.fails(format($$insert into public.gym_locations (gym_id, name, state, city) values (%L, 'X', 'Lara', 'Carora')$$, current_setting('t.gym_a')),
  'la recepcionista no puede crear sedes');
select t.ok(t.count('select 1 from public.audit_logs') = 0, 'la recepcionista no lee la auditoría');

select t.act_as('00000000-0000-0000-0000-0000000000a1');
select t.ok(t.count('select 1 from public.gym_staff') = 2, 'la dueña ve a todo su personal');
select t.ok(t.count('select 1 from public.profiles') = 2, 'la dueña ve el nombre de su personal, no el de otros');
select t.ok(t.count('select 1 from public.audit_logs') > 0, 'la dueña lee la auditoría de su gimnasio');
select t.ok(t.count($$select 1 from public.audit_logs where gym_id = current_setting('t.gym_b')::uuid$$) = 0, 'pero no la de otros gimnasios');
select t.fails(format($$select public.revoke_staff(%L, %L)$$, current_setting('t.gym_a'), '00000000-0000-0000-0000-0000000000a1'),
  'no se puede retirar al propietario');
select public.revoke_staff(current_setting('t.gym_a')::uuid, '00000000-0000-0000-0000-0000000000a2');

select t.act_as('00000000-0000-0000-0000-0000000000a2');
select t.ok(t.count('select 1 from public.gym_locations') = 1, 'tras retirarla solo ve lo público');
select t.ok((public.my_workspaces() -> 'gyms') = '[]'::jsonb, 'tras retirarla ya no tiene espacio de gimnasio');

-- -----------------------------------------------------------------------------
-- Suspensión y auditoría inmutable
-- -----------------------------------------------------------------------------
select t.act_as('00000000-0000-0000-0000-00000000000a');
select public.admin_set_affiliation_status(current_setting('t.gym_a')::uuid, 'suspended', 'Incumplimiento de prueba');
select t.fails($$delete from public.audit_logs$$, 'nadie borra la auditoría desde el cliente');
reset role;
select t.fails($$update public.audit_logs set action = 'x'$$, 'ni siquiera un superusuario modifica la auditoría');

set role anon;
select t.act_as(null);
select t.ok(t.count('select 1 from public.gyms') = 0, 'un gimnasio suspendido desaparece del público');
reset role;

set role authenticated;
select t.act_as('00000000-0000-0000-0000-0000000000a1');
select t.ok((public.my_workspaces() -> 'gyms' -> 0 ->> 'affiliation_status') = 'suspended', 'la dueña ve que su gimnasio está suspendido');
reset role;

\echo
select format('%s pruebas ejecutadas, %s correctas', count(*), count(*) filter (where ok)) as resultado from t.results;
