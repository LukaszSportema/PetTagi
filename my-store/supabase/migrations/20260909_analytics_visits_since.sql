-- Usuwanie starych wejść przy resecie licznika (ANALYTICS_VISITS_SINCE)

create or replace function public.admin_delete_analytics_daily_before(p_before date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt()->>'role', '') is distinct from 'service_role' then
    perform public.assert_admin();
  end if;

  delete from public.analytics_daily where day < p_before;
end;
$$;

revoke all on function public.admin_delete_analytics_daily_before(date) from public;
revoke all on function public.admin_delete_analytics_daily_before(date) from anon;
grant execute on function public.admin_delete_analytics_daily_before(date) to authenticated;
grant execute on function public.admin_delete_analytics_daily_before(date) to service_role;
