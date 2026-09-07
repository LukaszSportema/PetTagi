-- Synchronizacja analityki z sesji admina (bez SUPABASE_SERVICE_ROLE_KEY)

create or replace function public.admin_upsert_analytics_daily(p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt()->>'role', '') is distinct from 'service_role' then
    perform public.assert_admin();
  end if;

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

revoke all on function public.admin_upsert_analytics_daily(jsonb) from public;
revoke all on function public.admin_upsert_analytics_daily(jsonb) from anon;
grant execute on function public.admin_upsert_analytics_daily(jsonb) to authenticated;
grant execute on function public.admin_upsert_analytics_daily(jsonb) to service_role;
