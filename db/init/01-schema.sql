-- =====================================================================
--  assets-total-value — full schema for self-hosted Postgres + PostgREST
-- =====================================================================
--  Recreates everything the app talks to today. Derived from
--  src/api/supabaseApi.tsx + the components that consume it.
--
--  Runs automatically the FIRST time the postgres container starts with
--  an empty data volume. Later changes must be applied by hand:
--      docker compose exec -T db psql -U atv -d atv < db/init/01-schema.sql
-- =====================================================================


-- ---------------------------------------------------------------------
--  1. Roles
-- ---------------------------------------------------------------------
--  PostgREST connects as `authenticator`, which is deliberately powerless.
--  After it validates the JWT it SET ROLEs into `web_anon`, and web_anon's
--  grants are what actually decide what the browser can touch.
--  This is exactly how Supabase works under the hood.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'web_anon') then
    create role web_anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    -- password is set from the environment by 02-authenticator-password.sh
    create role authenticator noinherit login;
  end if;
end
$$;

grant web_anon to authenticator;

--  Postgres 14 and older hand CREATE on the public schema to everyone by
--  default, which would let the browser role create its own tables. PG15+
--  fixed that, but revoke it explicitly so this file is safe on any version.
revoke all on schema public from public;
grant usage on schema public to web_anon;


-- ---------------------------------------------------------------------
--  2. updated_at trigger
-- ---------------------------------------------------------------------
--  ShoppingList orders by updated_at to build its "recently added" list,
--  so the column has to maintain itself on every UPDATE.

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
--  3. shopping  — backs THREE tabs, not one
-- ---------------------------------------------------------------------
--    list = 0  ->  🛒 groceries      (ShoppingList)
--    list = 1  ->  🏡 house          (ShoppingList)
--    list = 2  ->  🔗 links          (LinksList — a row whose `name`
--                                     starts with "http" is rendered as
--                                     a link; the URL is parsed client-side,
--                                     so there is no separate url column)
--
--  status is TEXT on purpose, not an integer. The app compares it as a
--  string in several places (e.g. ['0','1'].includes(item.status)), so an
--  integer column would come back as a JSON number and silently break the
--  cart/history filtering.
--    '0' = on the list, '1' = in the cart, '2' = history

create table if not exists public.shopping (
  uuid       uuid        primary key default gen_random_uuid(),
  name       text        not null,
  status     text        not null default '0',
  list       integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists shopping_set_updated_at on public.shopping;
create trigger shopping_set_updated_at
  before update on public.shopping
  for each row execute function public.set_updated_at();

create index if not exists shopping_list_name_idx    on public.shopping (list, name);
create index if not exists shopping_updated_at_idx   on public.shopping (updated_at desc);


-- ---------------------------------------------------------------------
--  4. liabilities  — the two 💰 tabs
-- ---------------------------------------------------------------------
--  numeric, not float: these are money. The app already coerces with +,
--  so it copes with PostgREST returning numerics as JSON strings.

create table if not exists public.liabilities (
  uuid       uuid        primary key default gen_random_uuid(),
  name       text        not null,
  amount     numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
--  5. baby_events  — the 👶 tab
-- ---------------------------------------------------------------------
--  type: sleep | feeding | poop | pee | bath | vitamin
--  ended_at NULL means "instant event" for poop/pee/bath/vitamin, and
--  "still running" for sleep/feeding — the app tells them apart by type.
--  amount_ml is only ever set on feeding rows.

create table if not exists public.baby_events (
  uuid       uuid        primary key default gen_random_uuid(),
  type       text        not null,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  amount_ml  integer,
  created_at timestamptz not null default now()
);

create index if not exists baby_events_started_at_idx on public.baby_events (started_at desc);


-- ---------------------------------------------------------------------
--  6. Grants
-- ---------------------------------------------------------------------
--  One anon role with full CRUD, mirroring the permissive Supabase setup
--  the app was written against. Anyone holding the JWT can read and write
--  everything — see SETUP.md, section "How safe is this really".

grant select, insert, update, delete
  on public.shopping, public.liabilities, public.baby_events
  to web_anon;
