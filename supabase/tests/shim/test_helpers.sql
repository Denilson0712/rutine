-- Utilidades de prueba compartidas por los archivos *_test.sql
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

