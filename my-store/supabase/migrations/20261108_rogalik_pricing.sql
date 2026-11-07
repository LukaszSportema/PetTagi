-- Cennik rogalika: „od X zł” na kafelach mocowania + cena bazowa jednostkowa.

alter table public.store_settings
  add column if not exists rogalik_mounting_start_prices jsonb not null default '{
    "koraliki": 88,
    "karabinczyk": 72,
    "sznureczek": 67,
    "sznureczek-karabinczyk": 65
  }'::jsonb;

alter table public.store_settings
  add column if not exists rogalik_base_unit_price numeric not null default 50;

create or replace function public.get_rogalik_mounting_start_prices()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select rogalik_mounting_start_prices from public.store_settings where id = 'default'),
    '{
      "koraliki": 88,
      "karabinczyk": 72,
      "sznureczek": 67,
      "sznureczek-karabinczyk": 65
    }'::jsonb
  );
$$;

create or replace function public.admin_set_rogalik_mounting_start_prices(p_prices jsonb)
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
    (select rogalik_mounting_start_prices from public.store_settings where id = 'default'),
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

  insert into public.store_settings (id, payment_recipient, rogalik_mounting_start_prices, updated_at)
  values ('default', 'wiktoria', merged, now())
  on conflict (id) do update
    set rogalik_mounting_start_prices = excluded.rogalik_mounting_start_prices,
        updated_at = now();

  return merged;
end;
$$;

create or replace function public.get_rogalik_base_unit_price()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select rogalik_base_unit_price from public.store_settings where id = 'default'),
    50::numeric
  );
$$;

create or replace function public.admin_set_rogalik_base_unit_price(p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v numeric;
begin
  perform public.assert_admin();

  if p_amount is null or p_amount < 0 then
    raise exception 'invalid rogalik base price';
  end if;

  v := greatest(0, p_amount);

  insert into public.store_settings (id, payment_recipient, rogalik_base_unit_price, updated_at)
  values ('default', 'wiktoria', v, now())
  on conflict (id) do update
    set rogalik_base_unit_price = excluded.rogalik_base_unit_price,
        updated_at = now();

  return v;
end;
$$;

revoke all on function public.get_rogalik_mounting_start_prices() from public;
grant execute on function public.get_rogalik_mounting_start_prices() to anon, authenticated;

revoke all on function public.admin_set_rogalik_mounting_start_prices(jsonb) from public;
grant execute on function public.admin_set_rogalik_mounting_start_prices(jsonb) to authenticated;

revoke all on function public.get_rogalik_base_unit_price() from public;
grant execute on function public.get_rogalik_base_unit_price() to anon, authenticated;

revoke all on function public.admin_set_rogalik_base_unit_price(numeric) from public;
grant execute on function public.admin_set_rogalik_base_unit_price(numeric) to authenticated;
