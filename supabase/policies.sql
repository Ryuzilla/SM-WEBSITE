-- ════════════════════════════════════════════════════════════════
-- Row Level Security (RLS) policies for SM Sales Analytics
-- Run AFTER schema.sql.
--
-- Access model:
--   admin       → full access (read/write everything)
--   manager     → read all data
--   salesperson → read only rows where sales.salesperson matches their
--                 linked salesperson name
-- ════════════════════════════════════════════════════════════════

-- Helper: current user's role. (Named app_user_role to avoid the reserved
-- keyword CURRENT_ROLE.)
create or replace function public.app_user_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: current user's salesperson display name (for row scoping).
create or replace function public.current_salesperson_name()
returns text
language sql stable security definer set search_path = public
as $$
  select sp.name
  from public.profiles p
  join public.salespersons sp on sp.id = p.salesperson_id
  where p.id = auth.uid();
$$;

-- Enable RLS
alter table public.profiles     enable row level security;
alter table public.sales        enable row level security;
alter table public.salespersons enable row level security;
alter table public.companies    enable row level security;
alter table public.customers    enable row level security;
alter table public.products     enable row level security;
alter table public.targets      enable row level security;

-- ─────────────────────────── Profiles ──────────────────────────
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid() or public.app_user_role() in ('admin','manager'));

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.app_user_role() = 'admin')
  with check (public.app_user_role() = 'admin');

-- ─────────────────────────── Sales ─────────────────────────────
drop policy if exists "sales_read" on public.sales;
create policy "sales_read" on public.sales
  for select using (
    public.app_user_role() in ('admin','manager')
    or salesperson = public.current_salesperson_name()
  );

drop policy if exists "sales_admin_write" on public.sales;
create policy "sales_admin_write" on public.sales
  for all using (public.app_user_role() = 'admin')
  with check (public.app_user_role() = 'admin');

-- ─────────── Reference tables: readable by all authed users ─────
-- Writable only by admins.
do $$
declare t text;
begin
  foreach t in array array['salespersons','companies','customers','products','targets']
  loop
    execute format('drop policy if exists "%s_read" on public.%I;', t, t);
    execute format(
      'create policy "%s_read" on public.%I for select using (auth.role() = ''authenticated'');',
      t, t);

    execute format('drop policy if exists "%s_admin_write" on public.%I;', t, t);
    execute format(
      'create policy "%s_admin_write" on public.%I for all using (public.app_user_role() = ''admin'') with check (public.app_user_role() = ''admin'');',
      t, t);
  end loop;
end $$;
