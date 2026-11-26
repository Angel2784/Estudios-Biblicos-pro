-- Ejecuta este script en: Supabase Dashboard > SQL Editor > New query

-- 1. Tabla de perfiles (reemplaza los metadatos que antes guardaba Clerk)
create table if not exists public.profiles (
  id               uuid references auth.users(id) on delete cascade primary key,
  role             text default 'user',
  premium_hasta    date,
  consultas_usadas integer default 0,
  fecha_uso        date,
  created_at       timestamptz default now()
);

-- 2. Seguridad: cada usuario solo puede ver/editar su propia fila.
--    (El backend usa la Service Role Key y salta esta restricción cuando lo necesita).
alter table public.profiles enable row level security;

create policy "Los usuarios ven su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Los usuarios actualizan su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Trigger: crea automáticamente la fila de perfil cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. (Opcional) Para hacerte admin manualmente, corre esto después de registrarte
--    reemplazando el correo por el tuyo:
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'tu-correo@ejemplo.com');

-- 5. (Opcional) Para activar Premium manualmente a alguien:
-- update public.profiles set premium_hasta = '2027-01-01'
-- where id = (select id from auth.users where email = 'correo-cliente@ejemplo.com');
