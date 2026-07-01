-- Digital whiteboard v1.0 initial schema.
-- v1.0 operates one workshop per Supabase project. Add shop_id to these tables
-- and include it in every RLS policy before supporting multiple workshops.

create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  is_visible boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  assignee_id uuid not null references public.workers(id) on delete cascade,
  status text not null default 'not-started'
    check (status in ('not-started', 'working', 'waiting', 'done')),
  company text not null,
  plate_suffix text not null check (char_length(plate_suffix) between 1 and 4),
  car_name text not null,
  work_content text not null,
  customer_name text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.work_templates (
  id uuid primary key default gen_random_uuid(),
  label text not null unique check (char_length(trim(label)) > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_assignee_order_idx
  on public.jobs (assignee_id, sort_order);

create index if not exists jobs_completed_idx
  on public.jobs (completed_at desc)
  where status = 'done';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_job_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();

  if new.status = 'done' then
    if tg_op = 'INSERT' then
      new.completed_at = coalesce(new.completed_at, now());
    elsif old.status is distinct from 'done' then
      new.completed_at = coalesce(new.completed_at, now());
    end if;
  else
    new.completed_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists workers_set_updated_at on public.workers;
create trigger workers_set_updated_at
before update on public.workers
for each row execute function public.set_updated_at();

drop trigger if exists jobs_set_timestamps on public.jobs;
create trigger jobs_set_timestamps
before insert or update on public.jobs
for each row execute function public.set_job_timestamps();

drop trigger if exists work_templates_set_updated_at on public.work_templates;
create trigger work_templates_set_updated_at
before update on public.work_templates
for each row execute function public.set_updated_at();

alter table public.workers enable row level security;
alter table public.jobs enable row level security;
alter table public.work_templates enable row level security;

revoke all on public.workers, public.jobs, public.work_templates from anon;
grant select, insert, update, delete
  on public.workers, public.jobs, public.work_templates
  to authenticated;

drop policy if exists "authenticated workers access" on public.workers;
create policy "authenticated workers access"
on public.workers for all to authenticated
using (true) with check (true);

drop policy if exists "authenticated jobs access" on public.jobs;
create policy "authenticated jobs access"
on public.jobs for all to authenticated
using (true) with check (true);

drop policy if exists "authenticated templates access" on public.work_templates;
create policy "authenticated templates access"
on public.work_templates for all to authenticated
using (true) with check (true);

-- Realtime publication is intentionally deferred until the v1.0 sync step.
-- Never expose a Secret Key or the legacy service_role key in browser code.
