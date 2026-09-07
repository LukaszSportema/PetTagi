-- Reset licznika wejść: data w store_settings + czyszczenie starych dni

alter table public.store_settings
  add column if not exists analytics_visits_since date;

update public.store_settings
set analytics_visits_since = '2026-09-07'
where id = 'default';

create or replace function public.get_analytics_visits_since()
returns date
language sql
stable
security definer
set search_path = public
as $$
  select analytics_visits_since from public.store_settings where id = 'default';
$$;

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

delete from public.analytics_daily where day < '2026-09-07';

revoke all on function public.get_analytics_visits_since() from public;
grant execute on function public.get_analytics_visits_since() to authenticated;
grant execute on function public.get_analytics_visits_since() to service_role;

revoke all on function public.admin_delete_analytics_daily_before(date) from public;
revoke all on function public.admin_delete_analytics_daily_before(date) from anon;
grant execute on function public.admin_delete_analytics_daily_before(date) to authenticated;
grant execute on function public.admin_delete_analytics_daily_before(date) to service_role;
