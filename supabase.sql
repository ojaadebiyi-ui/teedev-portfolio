-- ============================================================
-- TEEDEV PORTFOLIO CMS — SUPABASE SQL
-- Run this once in Supabase SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  description text not null,
  role text,
  category text,
  year integer,
  status text not null default 'Live',
  live_url text,
  image_url text,
  tags text[] not null default '{}',
  featured boolean not null default false,
  published boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_experience (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text,
  year text,
  status text not null default 'Ongoing',
  description text not null,
  published boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admin table: only authenticated user IDs listed here can write.
create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.portfolio_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

alter table public.portfolio_projects enable row level security;
alter table public.portfolio_experience enable row level security;
alter table public.portfolio_admins enable row level security;

-- Public can read only published content.
drop policy if exists "public read published projects" on public.portfolio_projects;
create policy "public read published projects"
on public.portfolio_projects for select
using (published = true or public.is_portfolio_admin());

-- Admins can manage projects.
drop policy if exists "admins insert projects" on public.portfolio_projects;
create policy "admins insert projects" on public.portfolio_projects for insert to authenticated with check (public.is_portfolio_admin());
drop policy if exists "admins update projects" on public.portfolio_projects;
create policy "admins update projects" on public.portfolio_projects for update to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
drop policy if exists "admins delete projects" on public.portfolio_projects;
create policy "admins delete projects" on public.portfolio_projects for delete to authenticated using (public.is_portfolio_admin());

drop policy if exists "public read published experience" on public.portfolio_experience;
create policy "public read published experience"
on public.portfolio_experience for select
using (published = true or public.is_portfolio_admin());

drop policy if exists "admins insert experience" on public.portfolio_experience;
create policy "admins insert experience" on public.portfolio_experience for insert to authenticated with check (public.is_portfolio_admin());
drop policy if exists "admins update experience" on public.portfolio_experience;
create policy "admins update experience" on public.portfolio_experience for update to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
drop policy if exists "admins delete experience" on public.portfolio_experience;
create policy "admins delete experience" on public.portfolio_experience for delete to authenticated using (public.is_portfolio_admin());

-- An admin may read their own admin row. The function above is security definer,
-- so the public site does not need direct access to the admin table.
drop policy if exists "admins read own admin row" on public.portfolio_admins;
create policy "admins read own admin row" on public.portfolio_admins for select to authenticated using (user_id = auth.uid());

create or replace function public.set_portfolio_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists portfolio_projects_updated_at on public.portfolio_projects;
create trigger portfolio_projects_updated_at before update on public.portfolio_projects for each row execute function public.set_portfolio_updated_at();
drop trigger if exists portfolio_experience_updated_at on public.portfolio_experience;
create trigger portfolio_experience_updated_at before update on public.portfolio_experience for each row execute function public.set_portfolio_updated_at();

-- Seed your current projects.
insert into public.portfolio_projects (title, slug, description, role, category, year, status, live_url, tags, featured, published, display_order)
values
('D-KING ROYALE KITS STORE','d-king-royale-kits-store','A website created for D-KING ROYALE KITS STORE, giving the business a dedicated digital space to showcase its products and connect with customers.','Developer','Web Design & Development',2026,'Live','https://dkingroyale-jngnt9nt.manus.space/',array['Responsive Design','UI / UX','E-Commerce','Web Development'],true,true,1),
('KOLE WASTE LOGISTICS','kole-waste-logistics','A digital waste-collection logistics platform focused on improving coordination, tracking and operational efficiency around waste pickup and collection.','Volunteer / Developer','Product & Research',2026,'Live','https://koleofficial.vercel.app/',array['Product Design','Logistics','Research','Responsive Web'],true,true,2)
on conflict (slug) do nothing;

insert into public.portfolio_experience (title,type,year,status,description,published,display_order)
values
('D-KING ROYALE KITS STORE','PROJECT','2026','Live','Designed and developed a responsive digital storefront focused on product presentation, customer experience and brand visibility.',true,1),
('KOLE WASTE LOGISTICS','PRODUCT / VOLUNTEER','2026','Live','Contributed to a technology-driven waste logistics project exploring better ways to coordinate collection, drivers, customers and operational information.',true,2),
('BUILDING & EXPLORING','PERSONAL DEVELOPMENT','NOW','Ongoing','Continuously improving front-end development, UI/UX, digital products and technology while turning ideas into functional experiences.',true,3);

-- IMPORTANT: after creating your Supabase Auth user, run:
-- insert into public.portfolio_admins (user_id)
-- values ('YOUR-AUTH-USER-UUID');
