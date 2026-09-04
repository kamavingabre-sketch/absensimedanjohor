-- =============================================================
-- Absensi Digital Kecamatan Medan Johor — Schema Supabase
-- Jalankan file ini di: Supabase Dashboard → SQL Editor → New query
-- Aman dijalankan ulang (idempotent).
-- =============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Tabel: profiles
-- Satu baris per orang (pegawai + admin). id merujuk auth.users.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null,
  jabatan       text not null default '',
  unit          text not null default 'Kecamatan Medan Johor',
  staff_type    text not null default 'staff',        -- ASN | PPPK | PPPSU | Kepling | Admin
  staff_status  text[] not null default '{}',         -- mis. {PPPK,PPPSU} bila terdaftar di dua daftar
  email         text not null,
  role          text not null default 'staff' check (role in ('staff', 'admin')),
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_name_idx on public.profiles (full_name);
create index if not exists profiles_type_idx on public.profiles (staff_type);
create index if not exists profiles_unit_idx on public.profiles (unit);

-- ------------------------------------------------------------
-- Tabel: kegiatan
-- Satu baris per kegiatan. code dipakai di QR.
-- ------------------------------------------------------------
create table if not exists public.kegiatan (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,                  -- token QR, mis. KJ7F3QZ2
  name         text not null,
  description  text,
  location     text,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  is_active    boolean not null default true,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  constraint kegiatan_window check (ends_at > starts_at)
);

create index if not exists kegiatan_code_idx on public.kegiatan (code);
create index if not exists kegiatan_starts_idx on public.kegiatan (starts_at desc);

-- ------------------------------------------------------------
-- Tabel: absensi
-- Satu baris per pegawai per kegiatan (satu kali absen).
-- ------------------------------------------------------------
create table if not exists public.absensi (
  id             uuid primary key default gen_random_uuid(),
  kegiatan_id    uuid not null references public.kegiatan (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  checked_in_at  timestamptz not null default now(),
  latitude       double precision,
  longitude      double precision,
  accuracy       real,
  device_info    text,
  created_at     timestamptz not null default now(),
  unique (kegiatan_id, user_id)
);

create index if not exists absensi_kegiatan_idx on public.absensi (kegiatan_id);
create index if not exists absensi_user_idx on public.absensi (user_id, checked_in_at desc);

-- ------------------------------------------------------------
-- Helper: cek apakah pemakai login adalah admin.
-- security definer agar policy tidak rekursif.
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.kegiatan enable row level security;
alter table public.absensi  enable row level security;

-- profiles: semua yang login boleh membaca (daftar pegawai internal),
-- hanya admin yang boleh mengubah.
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- kegiatan: semua yang login boleh membaca, hanya admin yang menulis.
drop policy if exists "kegiatan_select_authenticated" on public.kegiatan;
create policy "kegiatan_select_authenticated"
  on public.kegiatan for select
  to authenticated
  using (true);

drop policy if exists "kegiatan_all_admin" on public.kegiatan;
create policy "kegiatan_all_admin"
  on public.kegiatan for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- absensi: pegawai boleh mem-baca data sendiri, dan hanya boleh
-- memasukkan baris atas nama dirinya. Admin boleh membaca semua.
drop policy if exists "absensi_select_self_or_admin" on public.absensi;
create policy "absensi_select_self_or_admin"
  on public.absensi for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "absensi_insert_self" on public.absensi;
create policy "absensi_insert_self"
  on public.absensi for insert
  to authenticated
  with check (user_id = auth.uid());
