-- Ceny startowe („od X zł”) na kaflach kroku Model — adresówka biżuteryjna.

alter table public.store_settings
  add column if not exists tag_model_start_prices jsonb not null default '{
    "sznurek-karabinier": 60,
    "sznurek-bez-karabinier": 67,
    "naszyjnik-koraliki": 60,
    "sama-karabinier": 60
  }'::jsonb;

create or replace function public.get_tag_model_start_prices()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select tag_model_start_prices from public.store_settings where id = 'default'),
    '{
      "sznurek-karabinier": 60,
      "sznurek-bez-karabinier": 67,
      "naszyjnik-koraliki": 60,
      "sama-karabinier": 60
    }'::jsonb
  );
$$;

create or replace function public.admin_set_tag_model_start_prices(p_prices jsonb)
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
    (select tag_model_start_prices from public.store_settings where id = 'default'),
    '{}'::jsonb
  );

  if p_prices ? 'sznurek-karabinier' then
    merged := jsonb_set(merged, '{sznurek-karabinier}', to_jsonb(greatest(0, (p_prices->>'sznurek-karabinier')::numeric)));
  end if;
  if p_prices ? 'sznurek-bez-karabinier' then
    merged := jsonb_set(merged, '{sznurek-bez-karabinier}', to_jsonb(greatest(0, (p_prices->>'sznurek-bez-karabinier')::numeric)));
  end if;
  if p_prices ? 'naszyjnik-koraliki' then
    merged := jsonb_set(merged, '{naszyjnik-koraliki}', to_jsonb(greatest(0, (p_prices->>'naszyjnik-koraliki')::numeric)));
  end if;
  if p_prices ? 'sama-karabinier' then
    merged := jsonb_set(merged, '{sama-karabinier}', to_jsonb(greatest(0, (p_prices->>'sama-karabinier')::numeric)));
  end if;

  insert into public.store_settings (id, payment_recipient, tag_model_start_prices, updated_at)
  values ('default', 'wiktoria', merged, now())
  on conflict (id) do update
    set tag_model_start_prices = excluded.tag_model_start_prices,
        updated_at = now();

  return merged;
end;
$$;

revoke all on function public.get_tag_model_start_prices() from public;
grant execute on function public.get_tag_model_start_prices() to anon, authenticated;

revoke all on function public.admin_set_tag_model_start_prices(jsonb) from public;
grant execute on function public.admin_set_tag_model_start_prices(jsonb) to authenticated;
