-- Przychody: snapshot ceny bazowej (rogalik / rabat) w admin_revenue_orders.

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
        select jsonb_agg(row_data order by revenue_at)
        from (
          select jsonb_build_object(
            'revenue_at', o.paid_at,
            'payment_recipient', o.payment_recipient,
            'total', o.total,
            'shipping_cost', o.shipping_cost,
            'fast_delivery_cost', o.fast_delivery_cost,
            'items', coalesce((
              select jsonb_agg(jsonb_build_object(
                'quantity', i.quantity,
                'product_slug', i.product_slug,
                'tag_model', i.tag_model,
                'ring_color', i.ring_color,
                'base_carabiner', i.base_carabiner,
                'extra_charms', i.extra_charms,
                'extra_carabiner', i.extra_carabiner,
                'string_premium', i.string_premium,
                'string_classic', i.string_classic,
                'string_glow', i.string_glow,
                'dog_neck', i.dog_neck,
                'stoppers', i.stoppers,
                'sticker', i.sticker,
                'dial_code_info', i.dial_code_info,
                'rogalik_mounting', i.rogalik_mounting,
                'rogalik_cord_color', i.rogalik_cord_color,
                'rogalik_beads', i.rogalik_beads,
                'rogalik_charms', i.rogalik_charms,
                'base_unit_price', i.base_unit_price
              ) order by i.sort_order, i.created_at)
              from public.order_items i
              where i.order_id = o.id
            ), '[]'::jsonb)
          ) as row_data,
          o.paid_at as revenue_at
          from public.orders o
          where o.status not in ('pending', 'cancelled')
            and o.paid_at is not null
        ) t
      ),
      '[]'::jsonb
    )
  );
end;
$$;

revoke all on function public.admin_revenue_orders() from public;
grant execute on function public.admin_revenue_orders() to authenticated;
