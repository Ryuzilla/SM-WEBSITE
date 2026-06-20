-- ════════════════════════════════════════════════════════════════
-- SM Sales Analytics — PostgreSQL schema (Supabase)
-- Run in: Supabase Dashboard → SQL Editor (or `supabase db push`)
-- ════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─────────────────────────── Enums ─────────────────────────────
do $$ begin
  create type user_role as enum ('admin', 'manager', 'salesperson');
exception when duplicate_object then null; end $$;

-- ─────────────────────────── Salespersons ──────────────────────
create table if not exists public.salespersons (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  email       text,
  region      text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────── Profiles ──────────────────────────
-- 1:1 with auth.users. Holds role + optional salesperson link.
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  role            user_role not null default 'salesperson',
  salesperson_id  uuid references public.salespersons(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────── Companies ─────────────────────────
create table if not exists public.companies (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  province    text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────── Customers ─────────────────────────
create table if not exists public.customers (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  company_id  uuid references public.companies(id) on delete set null,
  province    text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────── Products ──────────────────────────
create table if not exists public.products (
  id            uuid primary key default uuid_generate_v4(),
  product_code  text not null unique,
  product_name  text not null,
  category      text,
  unit_price    numeric(14,2) not null default 0,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────── Targets ───────────────────────────
-- Monthly revenue targets per salesperson.
create table if not exists public.targets (
  id              uuid primary key default uuid_generate_v4(),
  salesperson_id  uuid references public.salespersons(id) on delete cascade,
  year            int not null,
  month           int not null check (month between 1 and 12),
  target_amount   numeric(16,2) not null default 0,
  created_at      timestamptz not null default now(),
  unique (salesperson_id, year, month)
);

-- ─────────────────────────── Sales ─────────────────────────────
-- Denormalized fact table (one row per invoice line) — mirrors the
-- uploaded Excel structure for fast analytics + simple imports.
create table if not exists public.sales (
  id             uuid primary key default uuid_generate_v4(),
  date           date not null,
  invoice_no     text not null,
  customer_name  text not null,
  company_name   text not null,
  salesperson    text not null,
  product_code   text not null,
  product_name   text not null,
  category       text,
  -- quantity / sales_amount may be zero or negative: returns & credit notes
  -- are legitimate rows that reduce revenue.
  quantity       numeric(14,2) not null default 0,
  unit_price     numeric(14,2) not null default 0,
  sales_amount   numeric(16,2) not null default 0,
  province       text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- ─────────────────────────── Indexes ───────────────────────────
create index if not exists idx_sales_date          on public.sales (date);
create index if not exists idx_sales_salesperson   on public.sales (salesperson);
create index if not exists idx_sales_customer      on public.sales (customer_name);
create index if not exists idx_sales_company       on public.sales (company_name);
create index if not exists idx_sales_category      on public.sales (category);
create index if not exists idx_sales_product       on public.sales (product_name);
create index if not exists idx_sales_province      on public.sales (province);
create index if not exists idx_sales_invoice       on public.sales (invoice_no);
create index if not exists idx_targets_period      on public.targets (year, month);

-- ─────────────────────────── Auto-provision profile ────────────
-- Create a profile row automatically when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'salesperson'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
