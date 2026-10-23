-- =============================================================================
-- Rutine · 0500 · Almacenamiento de imágenes (Supabase Storage)
-- =============================================================================
-- Bucket "gym-media": fotos de gimnasios y entrenadores.
-- Ruta obligatoria: {gym_id}/{gyms|trainers}/{archivo}
-- Lectura pública (son imágenes de perfiles publicados); escritura solo para
-- administradores del gimnasio dueño de la carpeta.
-- Nota: una URL pública de un gimnasio en borrador se puede abrir si alguien
-- conoce la ruta exacta. No subas documentos privados a este bucket.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gym-media', 'gym-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create function public.storage_gym_id(p_name text)
returns uuid language plpgsql immutable set search_path = '' as $$
begin
  return (string_to_array(p_name, '/'))[1]::uuid;
exception when others then
  return null;
end;
$$;
grant execute on function public.storage_gym_id(text) to anon, authenticated;

create policy gym_media_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'gym-media'
    and (string_to_array(name, '/'))[2] in ('gyms', 'trainers')
    and public.is_gym_admin(public.storage_gym_id(name))
    and public.gym_is_editable(public.storage_gym_id(name))
  );

create policy gym_media_update on storage.objects for update to authenticated
  using (bucket_id = 'gym-media' and public.is_gym_admin(public.storage_gym_id(name)))
  with check (bucket_id = 'gym-media' and public.is_gym_admin(public.storage_gym_id(name)));

create policy gym_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'gym-media' and public.is_gym_admin(public.storage_gym_id(name)));
