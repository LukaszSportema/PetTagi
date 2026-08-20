-- PetTagi — kierunkowy na adresówce w raporcie przychodów

create or replace function public.admin_revenue_orders()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
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
  );
$$;

revoke all on function public.admin_revenue_orders() from public;
grant execute on function public.admin_revenue_orders() to anon, authenticated;
