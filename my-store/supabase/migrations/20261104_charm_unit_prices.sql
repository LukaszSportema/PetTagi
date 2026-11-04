-- Ceny jednostkowe charmsów (konfigurator, koszyk, maile).

alter table public.store_settings
  add column if not exists charm_unit_prices jsonb not null default '{}'::jsonb;

create or replace function public.get_charm_unit_prices()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select charm_unit_prices from public.store_settings where id = 'default'),
    '{}'::jsonb
  );
$$;

create or replace function public.admin_set_charm_unit_prices(p_prices jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  merged jsonb := '{}'::jsonb;
  entry record;
  amount numeric;
begin
  perform public.assert_admin();

  if p_prices is null or jsonb_typeof(p_prices) <> 'object' then
    raise exception 'invalid charm prices payload';
  end if;

  for entry in select * from jsonb_each(p_prices)
  loop
    amount := (entry.value #>> '{}')::numeric;
    if amount is null or amount < 0 then
      continue;
    end if;
    merged := jsonb_set(merged, array[entry.key], to_jsonb(amount));
  end loop;

  insert into public.store_settings (id, payment_recipient, charm_unit_prices, updated_at)
  values ('default', 'wiktoria', merged, now())
  on conflict (id) do update
    set charm_unit_prices = excluded.charm_unit_prices,
        updated_at = now();

  return merged;
end;
$$;

revoke all on function public.get_charm_unit_prices() from public;
grant execute on function public.get_charm_unit_prices() to anon, authenticated;

revoke all on function public.admin_set_charm_unit_prices(jsonb) from public;
grant execute on function public.admin_set_charm_unit_prices(jsonb) to authenticated;
