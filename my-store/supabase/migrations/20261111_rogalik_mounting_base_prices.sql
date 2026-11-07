-- Ceny bazowe rogalika per wariant mocowania (jak cena bazowa modeli biżuterii).

alter table public.store_settings
  add column if not exists rogalik_mounting_base_prices jsonb;

-- Wstępne wypełnienie: kopia dotychczasowej pojedynczej ceny bazowej albo 50 zł.
update public.store_settings
set rogalik_mounting_base_prices = jsonb_build_object(
  'koraliki', coalesce(rogalik_base_unit_price, 50::numeric),
  'karabinczyk', coalesce(rogalik_base_unit_price, 50::numeric),
  'sznureczek', coalesce(rogalik_base_unit_price, 50::numeric),
  'sznureczek-karabinczyk', coalesce(rogalik_base_unit_price, 50::numeric)
)
where rogalik_mounting_base_prices is null;

alter table public.store_settings
  alter column rogalik_mounting_base_prices set default '{
    "koraliki": 50,
    "karabinczyk": 50,
    "sznureczek": 50,
    "sznureczek-karabinczyk": 50
  }'::jsonb;

update public.store_settings
set rogalik_mounting_base_prices = '{
    "koraliki": 50,
    "karabinczyk": 50,
    "sznureczek": 50,
    "sznureczek-karabinczyk": 50
  }'::jsonb
where rogalik_mounting_base_prices is null;

alter table public.store_settings
  alter column rogalik_mounting_base_prices set not null;

create or replace function public.get_rogalik_mounting_base_prices()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select rogalik_mounting_base_prices from public.store_settings where id = 'default'),
    '{
      "koraliki": 50,
      "karabinczyk": 50,
      "sznureczek": 50,
      "sznureczek-karabinczyk": 50
    }'::jsonb
  );
$$;

create or replace function public.admin_set_rogalik_mounting_base_prices(p_prices jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  merged jsonb;
begin
  perform public.assert_admin();

  merged := coalesce(
    (select rogalik_mounting_base_prices from public.store_settings where id = 'default'),
    '{}'::jsonb
  );

  if p_prices ? 'koraliki' then
    merged := jsonb_set(merged, '{koraliki}', to_jsonb(greatest(0, (p_prices->>'koraliki')::numeric)));
  end if;
  if p_prices ? 'karabinczyk' then
    merged := jsonb_set(merged, '{karabinczyk}', to_jsonb(greatest(0, (p_prices->>'karabinczyk')::numeric)));
  end if;
  if p_prices ? 'sznureczek' then
    merged := jsonb_set(merged, '{sznureczek}', to_jsonb(greatest(0, (p_prices->>'sznureczek')::numeric)));
  end if;
  if p_prices ? 'sznureczek-karabinczyk' then
    merged := jsonb_set(
      merged,
      '{sznureczek-karabinczyk}',
      to_jsonb(greatest(0, (p_prices->>'sznureczek-karabinczyk')::numeric))
    );
  end if;

  insert into public.store_settings (id, payment_recipient, rogalik_mounting_base_prices, updated_at)
  values ('default', 'wiktoria', merged, now())
  on conflict (id) do update
    set rogalik_mounting_base_prices = excluded.rogalik_mounting_base_prices,
        updated_at = now();

  return merged;
end;
$$;

revoke all on function public.get_rogalik_mounting_base_prices() from public;
grant execute on function public.get_rogalik_mounting_base_prices() to anon, authenticated;

revoke all on function public.admin_set_rogalik_mounting_base_prices(jsonb) from public;
grant execute on function public.admin_set_rogalik_mounting_base_prices(jsonb) to authenticated;
