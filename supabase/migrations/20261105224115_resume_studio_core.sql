-- Resume Studio core schema: profiles, resumes, approved versions and audit events.
-- Every table is private to its owner via RLS.

-- Profiles (one per auth user), including the consent captured at sign-up.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  consent_version text,
  consented_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner can read" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: owner can update" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Create the profile row when a user signs up, copying consent from sign-up metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, consent_version, consented_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'consent_version',
    case when new.raw_user_meta_data ? 'consent_version' then now() end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at current.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Resumes: working drafts. Content is a structured JSON document where every
-- entry carries its source and whether the user has confirmed it.
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Untitled resume',
  origin text not null check (origin in ('qa', 'upload')),
  content jsonb not null default '{}'::jsonb,
  qa_state jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'approved')),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resumes_user_id_idx on public.resumes (user_id, updated_at desc);

create trigger resumes_set_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

alter table public.resumes enable row level security;

create policy "resumes: owner can read" on public.resumes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "resumes: owner can insert" on public.resumes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "resumes: owner can update" on public.resumes
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "resumes: owner can delete" on public.resumes
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Resume versions: immutable snapshots taken when the user approves content for export.
create table public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content jsonb not null,
  reason text not null default 'approved',
  created_at timestamptz not null default now()
);

create index resume_versions_resume_id_idx on public.resume_versions (resume_id, created_at desc);
create index resume_versions_user_id_idx on public.resume_versions (user_id);

alter table public.resume_versions enable row level security;

create policy "resume_versions: owner can read" on public.resume_versions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "resume_versions: owner can insert" on public.resume_versions
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = (select auth.uid()))
  );

-- Audit events: append-only log of important user actions (no update/delete policies).
create table public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  resume_id uuid references public.resumes (id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_user_id_idx on public.audit_events (user_id, created_at desc);
create index audit_events_resume_id_idx on public.audit_events (resume_id);

alter table public.audit_events enable row level security;

create policy "audit_events: owner can read" on public.audit_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "audit_events: owner can insert" on public.audit_events
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Self-service account deletion. Deletes the caller's auth user; all their rows cascade.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
