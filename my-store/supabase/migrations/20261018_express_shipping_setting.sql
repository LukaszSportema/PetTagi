-- Włączanie / wyłączanie oferty wysyłki ekspres (termin realizacji) w sklepie.

alter table public.store_settings
  add column if not exists express_shipping_enabled boolean not null default true;

update public.store_settings
set express_shipping_enabled = true
where id = 'default' and express_shipping_enabled is null;

create or replace function public.get_express_shipping_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select express_shipping_enabled from public.store_settings where id = 'default'),
    true
  );
$$;

create or replace function public.admin_set_express_shipping_enabled(p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();

  insert into public.store_settings (id, payment_recipient, express_shipping_enabled, updated_at)
  values ('default', 'wiktoria', coalesce(p_enabled, true), now())
  on conflict (id) do update
    set express_shipping_enabled = excluded.express_shipping_enabled,
        updated_at = now();

  return coalesce(p_enabled, true);
end;
$$;

revoke all on function public.get_express_shipping_enabled() from public;
grant execute on function public.get_express_shipping_enabled() to anon, authenticated;

revoke all on function public.admin_set_express_shipping_enabled(boolean) from public;
grant execute on function public.admin_set_express_shipping_enabled(boolean) to authenticated;
