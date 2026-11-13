-- AI assist allowance, tailored resume copies, and the candidate-approved job application tracker.

-- AI usage: one row per AI call, used to enforce a daily per-user allowance.
-- Append-only for the owner (no update/delete policies), so the allowance can't be reset by the client.
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  feature text not null,
  units integer not null default 1 check (units between 1 and 20),
  created_at timestamptz not null default now()
);

create index ai_usage_user_id_created_at_idx on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

create policy "ai_usage: owner can read" on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "ai_usage: owner can insert" on public.ai_usage
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Tailored copies of a resume for a specific job keep a link to the resume they came from.
alter table public.resumes add column parent_id uuid references public.resumes (id) on delete set null;
create index resumes_parent_id_idx on public.resumes (parent_id);

alter table public.resumes drop constraint resumes_origin_check;
alter table public.resumes add constraint resumes_origin_check check (origin in ('qa', 'upload', 'tailored'));

-- Job applications. Nothing is ever submitted automatically: the candidate approves
-- each application and applies on the employer's site themselves.
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  resume_id uuid references public.resumes (id) on delete set null,
  company text not null default '',
  job_title text not null default '',
  job_url text not null default '',
  description text not null default '' check (char_length(description) <= 20000),
  status text not null default 'saved'
    check (status in ('saved', 'tailoring', 'ready', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn')),
  match_score integer check (match_score between 0 and 100),
  cover_letter text not null default '',
  notes text not null default '',
  approved_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_applications_user_id_idx on public.job_applications (user_id, updated_at desc);
create index job_applications_resume_id_idx on public.job_applications (resume_id);

create trigger job_applications_set_updated_at
  before update on public.job_applications
  for each row execute function public.set_updated_at();

alter table public.job_applications enable row level security;

create policy "job_applications: owner can read" on public.job_applications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "job_applications: owner can insert" on public.job_applications
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (resume_id is null or exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = (select auth.uid())))
  );
create policy "job_applications: owner can update" on public.job_applications
  for update to authenticated using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id
    and (resume_id is null or exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = (select auth.uid())))
  );
create policy "job_applications: owner can delete" on public.job_applications
  for delete to authenticated using ((select auth.uid()) = user_id);
