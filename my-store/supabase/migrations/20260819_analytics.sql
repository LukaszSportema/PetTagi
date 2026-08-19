-- PetTagi — dzienna analityka Vercel + dane do zakładki Analityka
-- Wklej w Supabase: SQL Editor → Run

create table if not exists public.analytics_daily (
  day date primary key,
  unique_visitors integer not null default 0,
  pageviews integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.analytics_daily enable row level security;

create or replace function public.admin_upsert_analytics_daily(p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'p_rows must be an array';
  end if;

  insert into public.analytics_daily (day, unique_visitors, pageviews)
  select
    (item->>'day')::date,
    coalesce((item->>'unique_visitors')::integer, 0),
    coalesce((item->>'pageviews')::integer, 0)
  from jsonb_array_elements(p_rows) as item
  where nullif(item->>'day', '') is not null
  on conflict (day) do update
    set unique_visitors = excluded.unique_visitors,
        pageviews = excluded.pageviews,
        updated_at = now();
end;
$$;

create or replace function public.admin_list_analytics_daily()
returns setof public.analytics_daily
language sql
stable
security definer
set search_path = public
as $$
  select * from public.analytics_daily order by day;
$$;

create or replace function public.admin_analytics_orders()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'created_at', created_at,
      'status', status
    ) order by created_at),
    '[]'::jsonb
  )
  from public.orders;
$$;

revoke all on function public.admin_upsert_analytics_daily(jsonb) from public;
grant execute on function public.admin_upsert_analytics_daily(jsonb) to anon, authenticated;

revoke all on function public.admin_list_analytics_daily() from public;
grant execute on function public.admin_list_analytics_daily() to anon, authenticated;

revoke all on function public.admin_analytics_orders() from public;
grant execute on function public.admin_analytics_orders() to anon, authenticated;
