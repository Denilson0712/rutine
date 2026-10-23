-- =============================================================================
-- Pruebas: perfil público y entrenadores por gimnasio
-- Prepara sus propios usuarios y gimnasios; como superusuario solo crea cuentas
-- y concede el rol de administrador de prueba.
-- =============================================================================
\set ON_ERROR_STOP on
set client_min_messages = warning;
truncate t.results;

insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-00000000000a', 'admin2@rutine.test'),
  ('10000000-0000-0000-0000-0000000000a1', 'dueno@gym-x.test'),
  ('10000000-0000-0000-0000-0000000000b1', 'duena@gym-y.test'),
  ('10000000-0000-0000-0000-0000000000a3', 'coach@gym-x.test'),
  ('10000000-0000-0000-0000-0000000000c1', 'atleta2@correo.test');
insert into public.user_roles (user_id, role) values ('10000000-0000-0000-0000-00000000000a', 'super_admin');

-- Prepara dos gimnasios aprobados con una sede cada uno.
create function t.approved_gym(p_owner uuid, p_name text, p_city text) returns uuid language plpgsql as $$
declare v uuid;
begin
  set local role authenticated;
  perform t.act_as(p_owner);
  v := public.create_gym(p_name);
  update public.gym_business_details set legal_name = p_name || ' C.A.', rif = 'J-11111111-1', contact_phone = '04141234567' where gym_id = v;
  insert into public.gym_locations (gym_id, name, state, city, is_primary) values (v, 'Sede principal', 'Carabobo', p_city, true);
  perform public.accept_affiliation_terms(v, '2026-10');
  perform public.submit_affiliation(v);
  perform t.act_as('10000000-0000-0000-0000-00000000000a');
  perform public.admin_set_affiliation_status(v, 'under_review');
  perform public.admin_set_affiliation_status(v, 'approved', 'ok');
  reset role;
  return v;
end $$;

select set_config('t.gx', t.approved_gym('10000000-0000-0000-0000-0000000000a1', 'Gym X', 'Valencia')::text, false);
select set_config('t.gy', t.approved_gym('10000000-0000-0000-0000-0000000000b1', 'Gym Y', 'Naguanagua')::text, false);
select set_config('t.lx', (select id::text from public.gym_locations where gym_id = current_setting('t.gx')::uuid), false);
select set_config('t.ly', (select id::text from public.gym_locations where gym_id = current_setting('t.gy')::uuid), false);

-- -----------------------------------------------------------------------------
-- Alta y aislamiento
-- -----------------------------------------------------------------------------
set role authenticated;
select t.act_as('10000000-0000-0000-0000-0000000000a1');
select set_config('t.tx', public.create_trainer(current_setting('t.gx')::uuid, 'Carlos Pérez')::text, false);
select set_config('t.tx2', public.create_trainer(current_setting('t.gx')::uuid, 'Carlos Pérez')::text, false);
select t.ok((select slug from public.trainers where id = current_setting('t.tx2')::uuid) = 'carlos-perez-2', 'slug único dentro del gimnasio');
select t.fails($$insert into public.trainers (gym_id, slug, full_name) values (current_setting('t.gx')::uuid, 'directo', 'Directo')$$,
  'no se crean entrenadores sin create_trainer');
select t.fails(format($$select public.create_trainer(%L, 'Intruso')$$, current_setting('t.gy')),
  'un dueño no registra entrenadores en otro gimnasio');

update public.trainers
   set specialties = '{Fuerza,Musculación}', bio = 'Entrenador de fuerza.', experience_years = 6, headline = 'Fuerza y técnica'
 where id = current_setting('t.tx')::uuid;
insert into public.trainer_locations (trainer_id, location_id) values (current_setting('t.tx')::uuid, current_setting('t.lx')::uuid);
select t.fails(format($$insert into public.trainer_locations (trainer_id, location_id) values (%L, %L)$$, current_setting('t.tx'), current_setting('t.ly')),
  'no se asigna un entrenador a la sede de otro gimnasio');
select t.fails(format($$insert into public.trainer_availability (trainer_id, location_id, weekday, starts_at, ends_at) values (%L, %L, 1, '18:00', '17:00')$$,
  current_setting('t.tx'), current_setting('t.lx')), 'el horario debe terminar después de empezar');
insert into public.trainer_availability (trainer_id, location_id, weekday, starts_at, ends_at)
values (current_setting('t.tx')::uuid, current_setting('t.lx')::uuid, 1, '06:00', '10:00');
insert into public.trainer_certifications (trainer_id, name, issuer, year, verified_at)
values (current_setting('t.tx')::uuid, 'Entrenador personal', 'Instituto de prueba', 2020, now());
select t.ok((select verified_by from public.trainer_certifications limit 1) = auth.uid(), 'la verificación registra quién la hizo');

select t.act_as('10000000-0000-0000-0000-0000000000b1');
select t.ok(t.count('select 1 from public.trainers') = 0, 'el dueño Y no ve fichas privadas del gimnasio X');
update public.trainers set full_name = 'Hackeado' where id = current_setting('t.tx')::uuid;
reset role;
select t.ok((select full_name from public.trainers where id = current_setting('t.tx')::uuid) = 'Carlos Pérez', 'el dueño Y no edita entrenadores de X');

-- -----------------------------------------------------------------------------
-- Visibilidad pública
-- -----------------------------------------------------------------------------
set role anon;
select t.act_as(null);
select t.ok(t.count('select 1 from public.trainers') = 0, 'una ficha no publicada es invisible al público');
reset role;

set role authenticated;
select t.act_as('10000000-0000-0000-0000-0000000000a1');
update public.trainers set is_public = true where id = current_setting('t.tx')::uuid;
reset role;

set role anon;
select t.act_as(null);
select t.ok(t.count('select 1 from public.trainers') = 1, 'la ficha publicada aparece');
select t.ok(t.count('select 1 from public.trainer_availability') = 1, 'su disponibilidad es pública');
select t.ok(t.count('select 1 from public.trainer_certifications') = 1, 'sus certificaciones son públicas');
select t.fails('select * from public.trainer_accounts', 'el vínculo con cuentas de usuario no es público');
select t.ok(t.count(format('select 1 from public.trainers where gym_id = %L', current_setting('t.gy'))) = 0,
  'filtrar por gimnasio no mezcla entrenadores de otros gimnasios');
reset role;

-- -----------------------------------------------------------------------------
-- Cuenta del entrenador y permisos limitados
-- -----------------------------------------------------------------------------
set role authenticated;
select t.act_as('10000000-0000-0000-0000-0000000000a1');
select set_config('t.tok', public.invite_staff(current_setting('t.gx')::uuid, 'coach@gym-x.test', 'trainer'), false);
select t.fails(format($$insert into public.trainer_accounts (trainer_id, user_id) values (%L, %L)$$, current_setting('t.tx'), '10000000-0000-0000-0000-0000000000c1'),
  'solo se vincula una cuenta que sea entrenador del gimnasio');

select t.act_as('10000000-0000-0000-0000-0000000000a3');
select public.accept_staff_invitation(current_setting('t.tok'));
select t.act_as('10000000-0000-0000-0000-0000000000a1');
insert into public.trainer_accounts (trainer_id, user_id) values (current_setting('t.tx')::uuid, '10000000-0000-0000-0000-0000000000a3');

select t.act_as('10000000-0000-0000-0000-0000000000a3');
select t.ok(t.count('select 1 from public.gym_business_details') = 0, 'el entrenador no ve datos comerciales');
select t.ok(t.count('select 1 from public.audit_logs') = 0, 'el entrenador no ve la auditoría');
update public.trainers set bio = 'Sin permiso' where id = current_setting('t.tx')::uuid;
reset role;
select t.ok((select bio from public.trainers where id = current_setting('t.tx')::uuid) = 'Entrenador de fuerza.', 'sin autorización no edita su ficha');

set role authenticated;
select t.act_as('10000000-0000-0000-0000-0000000000a1');
update public.trainer_accounts set self_edit_allowed = true where trainer_id = current_setting('t.tx')::uuid;

select t.act_as('10000000-0000-0000-0000-0000000000a3');
update public.trainers set bio = 'Bio escrita por el entrenador' where id = current_setting('t.tx')::uuid;
select t.ok((select bio from public.trainers where id = current_setting('t.tx')::uuid) = 'Bio escrita por el entrenador', 'con autorización edita su biografía');
select t.fails(format($$update public.trainers set is_public = false where id = %L$$, current_setting('t.tx')),
  'el entrenador no cambia su visibilidad');
select t.fails(format($$update public.trainer_certifications set verified_at = now() where trainer_id = %L$$, current_setting('t.tx')),
  'el entrenador no verifica certificaciones');
insert into public.trainer_certifications (trainer_id, name, verified_at) values (current_setting('t.tx')::uuid, 'Autodeclarada', now());
select t.ok((select verified_at is null from public.trainer_certifications where name = 'Autodeclarada'), 'una certificación propia entra sin verificar');
update public.trainer_certifications set year = 2019 where name = 'Entrenador personal';
select t.ok((select verified_at is null from public.trainer_certifications where name = 'Entrenador personal'),
  'editar una certificación verificada retira la verificación');
update public.trainer_accounts set self_edit_allowed = false where trainer_id = current_setting('t.tx')::uuid;
reset role;
select t.ok((select self_edit_allowed from public.trainer_accounts where trainer_id = current_setting('t.tx')::uuid),
  'el entrenador no puede cambiar sus propios permisos');
set role authenticated;

-- Otro gimnasio no puede mover la ficha.
select t.act_as('10000000-0000-0000-0000-0000000000a1');
select t.fails(format($$update public.trainers set gym_id = %L where id = %L$$, current_setting('t.gy'), current_setting('t.tx')),
  'una ficha no se mueve a otro gimnasio');

-- Planes visibles solo si son públicos y activos.
insert into public.membership_plans (gym_id, name, kind, price_amount) values
  (current_setting('t.gx')::uuid, 'Inscripción', 'enrollment', 10),
  (current_setting('t.gx')::uuid, 'Plan interno', 'monthly', 5);
update public.membership_plans set is_public = false where name = 'Plan interno';
select t.fails(format($$insert into public.membership_plans (gym_id, name, kind, price_amount) values (%L, 'Negativo', 'monthly', -1)$$, current_setting('t.gx')),
  'no se aceptan precios negativos');
reset role;

set role anon;
select t.act_as(null);
select t.ok(t.count('select 1 from public.membership_plans') = 1, 'el público solo ve planes publicados');
reset role;

-- Suspender el gimnasio oculta también a sus entrenadores.
set role authenticated;
select t.act_as('10000000-0000-0000-0000-00000000000a');
select public.admin_set_affiliation_status(current_setting('t.gx')::uuid, 'suspended', 'Prueba de suspensión');
reset role;
set role anon;
select t.act_as(null);
select t.ok(t.count('select 1 from public.trainers') = 0, 'los entrenadores de un gimnasio suspendido no se publican');
reset role;

-- Storage: solo el administrador del gimnasio sube a su carpeta.
insert into storage.buckets (id, name, public) values ('gym-media', 'gym-media', true) on conflict do nothing;
set role authenticated;
select t.act_as('10000000-0000-0000-0000-0000000000b1');
insert into storage.objects (bucket_id, name) values ('gym-media', current_setting('t.gy') || '/trainers/foto.jpg');
select t.fails(format($$insert into storage.objects (bucket_id, name) values ('gym-media', %L)$$, current_setting('t.gx') || '/trainers/foto.jpg'),
  'no se suben fotos a la carpeta de otro gimnasio');
select t.fails(format($$insert into storage.objects (bucket_id, name) values ('gym-media', %L)$$, current_setting('t.gy') || '/privado/doc.pdf'),
  'solo se permiten las carpetas gyms/ y trainers/');
reset role;

\echo
select format('%s pruebas ejecutadas, %s correctas', count(*), count(*) filter (where ok)) as resultado from t.results;
