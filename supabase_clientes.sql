-- ============================================================
-- Ejecutar en Supabase → SQL Editor → New query → Run
-- Proyecto: wuifruvuuymqccpzafju
-- ============================================================

-- 1. Tabla de clientes
create table if not exists clientes (
  id                  bigint generated always as identity primary key,
  nombre              text not null,
  codigo              text not null unique,
  rutina_id           text references rutinas(id) on delete set null,
  sesiones_objetivo   int  not null default 4,
  activo              boolean not null default true,
  created_at          timestamptz not null default now()
);

-- 2. Tabla de check-ins (sesiones marcadas como completadas)
create table if not exists checkins (
  id           bigint generated always as identity primary key,
  cliente_id   bigint not null references clientes(id) on delete cascade,
  fecha        date not null default current_date,
  created_at   timestamptz not null default now(),
  unique (cliente_id, fecha)
);

-- 3. Seguridad — igual que rutinas/pdfs: acceso público vía anon key
--    (la app ya funciona así para el resto de tablas)
alter table clientes enable row level security;
alter table checkins enable row level security;

create policy "clientes_select" on clientes for select using (true);
create policy "clientes_insert" on clientes for insert with check (true);
create policy "clientes_update" on clientes for update using (true);
create policy "clientes_delete" on clientes for delete using (true);

create policy "checkins_select" on checkins for select using (true);
create policy "checkins_insert" on checkins for insert with check (true);
create policy "checkins_delete" on checkins for delete using (true);
