-- PetTagi — zabezpieczenie funkcji administratora (wymaga app_metadata.role = 'admin')

create or replace function public.assert_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Brak uprawnień administratora' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.admin_list_orders()
returns setof public.orders
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query select * from public.orders order by created_at desc;
end;
$$;

create or replace function public.admin_get_order(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  perform public.assert_admin();

  select jsonb_build_object(
    'order', to_jsonb(o),
    'items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.sort_order, i.created_at)
      from public.order_items i
      where i.order_id = o.id
    ), '[]'::jsonb)
  )
  into result
  from public.orders o
  where o.id = p_id;

  return result;
end;
$$;

create or replace function public.admin_set_inpost_code(p_id uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.orders
  set inpost_code = nullif(trim(p_code), '')
  where id = p_id;
end;
$$;

create or replace function public.admin_set_order_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();

  if p_status not in ('pending', 'paid', 'processing', 'shipped', 'cancelled') then
    raise exception 'invalid order status';
  end if;

  update public.orders
  set status = p_status::public.order_status
  where id = p_id;

  if not found then
    raise exception 'order not found';
  end if;
end;
$$;

create or replace function public.admin_set_payment_recipient(p_recipient text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();

  if p_recipient not in ('wiktoria', 'lukasz') then
    raise exception 'invalid payment recipient';
  end if;

  insert into public.store_settings (id, payment_recipient, updated_at)
  values ('default', p_recipient, now())
  on conflict (id) do update
    set payment_recipient = excluded.payment_recipient,
        updated_at = now();

  return p_recipient;
end;
$$;

create or replace function public.admin_list_analytics_daily()
returns setof public.analytics_daily
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query select * from public.analytics_daily order by day;
end;
$$;

create or replace function public.admin_analytics_orders()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return (
    select coalesce(
      jsonb_agg(jsonb_build_object(
        'created_at', created_at,
        'status', status
      ) order by created_at),
      '[]'::jsonb
    )
    from public.orders
  );
end;
$$;

create or replace function public.admin_popularity_items()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return (
    select coalesce(
      (
        select jsonb_agg(row_data order by created_at)
        from (
          select jsonb_build_object(
            'created_at', o.created_at,
            'quantity', i.quantity,
            'ring_color', i.ring_color,
            'base_color', i.base_color,
            'base_charms', i.base_charms,
            'extra_charms', i.extra_charms,
            'base_carabiner', i.base_carabiner,
            'extra_carabiner', i.extra_carabiner,
            'string_classic', i.string_classic,
            'string_premium', i.string_premium,
            'string_glow', i.string_glow,
            'stoppers', i.stoppers,
            'sticker', i.sticker
          ) as row_data,
          o.created_at
          from public.orders o
          join public.order_items i on i.order_id = o.id
          where o.status not in ('pending', 'cancelled')
        ) t
      ),
      '[]'::jsonb
    )
  );
end;
$$;

create or replace function public.admin_revenue_orders()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return (
    select coalesce(
      (
        select jsonb_agg(row_data order by created_at)
        from (
          select jsonb_build_object(
            'created_at', o.created_at,
            'total', o.total,
            'shipping_cost', o.shipping_cost,
            'fast_delivery_cost', o.fast_delivery_cost,
            'items', coalesce((
              select jsonb_agg(jsonb_build_object(
                'quantity', i.quantity,
                'extra_charms', i.extra_charms,
                'extra_carabiner', i.extra_carabiner,
                'string_premium', i.string_premium,
                'string_classic', i.string_classic,
                'string_glow', i.string_glow,
                'dog_neck', i.dog_neck,
                'stoppers', i.stoppers,
                'sticker', i.sticker,
                'dial_code_info', i.dial_code_info
              ) order by i.sort_order, i.created_at)
              from public.order_items i
              where i.order_id = o.id
            ), '[]'::jsonb)
          ) as row_data,
          o.created_at
          from public.orders o
          where o.status not in ('pending', 'cancelled')
        ) t
      ),
      '[]'::jsonb
    )
  );
end;
$$;

revoke all on function public.assert_admin() from public;
grant execute on function public.assert_admin() to authenticated;

revoke all on function public.admin_list_orders() from public;
revoke all on function public.admin_get_order(uuid) from public;
revoke all on function public.admin_set_inpost_code(uuid, text) from public;
revoke all on function public.admin_set_order_status(uuid, text) from public;
revoke all on function public.admin_set_payment_recipient(text) from public;
revoke all on function public.admin_list_analytics_daily() from public;
revoke all on function public.admin_analytics_orders() from public;
revoke all on function public.admin_popularity_items() from public;
revoke all on function public.admin_revenue_orders() from public;

grant execute on function public.admin_list_orders() to authenticated;
grant execute on function public.admin_get_order(uuid) to authenticated;
grant execute on function public.admin_set_inpost_code(uuid, text) to authenticated;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;
grant execute on function public.admin_set_payment_recipient(text) to authenticated;
grant execute on function public.admin_list_analytics_daily() to authenticated;
grant execute on function public.admin_analytics_orders() to authenticated;
grant execute on function public.admin_popularity_items() to authenticated;
grant execute on function public.admin_revenue_orders() to authenticated;

revoke all on function public.admin_upsert_analytics_daily(jsonb) from public;
revoke all on function public.admin_upsert_analytics_daily(jsonb) from anon;
revoke all on function public.admin_upsert_analytics_daily(jsonb) from authenticated;
grant execute on function public.admin_upsert_analytics_daily(jsonb) to service_role;
