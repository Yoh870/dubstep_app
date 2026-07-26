-- Run this once in the Supabase SQL Editor for this project.

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null default 'Unknown',
  url text not null,
  duration integer not null default 0,
  source text not null check (source in ('upload', 'youtube')),
  created_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  track_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.tracks enable row level security;
alter table public.playlists enable row level security;

drop policy if exists "Public read access for tracks" on public.tracks;
drop policy if exists "Public insert access for tracks" on public.tracks;
drop policy if exists "Public delete access for tracks" on public.tracks;
create policy "Public read access for tracks" on public.tracks for select to anon using (true);
create policy "Public insert access for tracks" on public.tracks for insert to anon with check (true);
create policy "Public delete access for tracks" on public.tracks for delete to anon using (true);

drop policy if exists "Public read access for playlists" on public.playlists;
drop policy if exists "Public insert access for playlists" on public.playlists;
create policy "Public read access for playlists" on public.playlists for select to anon using (true);
create policy "Public insert access for playlists" on public.playlists for insert to anon with check (true);

insert into storage.buckets (id, name, public)
values ('music', 'music', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read access for music" on storage.objects;
drop policy if exists "Public upload access for music" on storage.objects;
drop policy if exists "Public delete access for music" on storage.objects;
create policy "Public read access for music" on storage.objects for select to anon using (bucket_id = 'music');
create policy "Public upload access for music" on storage.objects for insert to anon with check (bucket_id = 'music');
create policy "Public delete access for music" on storage.objects for delete to anon using (bucket_id = 'music');
