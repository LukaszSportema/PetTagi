-- Przychody: data opłacenia (paid_at), nie data złożenia zamówienia

alter table public.orders
  add column if not exists paid_at timestamptz;

create index if not exists orders_paid_at_idx on public.orders (paid_at desc)
  where paid_at is not null;

-- Historyczne opłacone: brak dokładnej daty — przybliżenie z updated_at
update public.orders
set paid_at = updated_at
where paid_at is null
  and status not in ('pending', 'cancelled');

create or replace function public.admin_set_order_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.order_status;
begin
  perform public.assert_admin();

  if p_status not in ('pending', 'paid', 'processing', 'shipped', 'cancelled') then
    raise exception 'invalid order status';
  end if;

  select status
  into current_status
  from public.orders
  where id = p_id;

  if not found then
    raise exception 'order not found';
  end if;

  if p_status = 'pending' and current_status in ('paid', 'processing', 'shipped', 'completed') then
    raise exception 'paid order cannot be set back to pending';
  end if;

  update public.orders
  set
    status = p_status::public.order_status,
    paid_at = case
      when p_status = 'paid'::text and current_status is distinct from 'paid'::public.order_status then now()
      else paid_at
    end
  where id = p_id;

  if p_status = 'paid' and current_status is distinct from 'paid'::public.order_status then
    perform public.warehouse_apply_paid_order(p_id);
  end if;
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
        select jsonb_agg(row_data order by paid_at)
        from (
          select jsonb_build_object(
            'paid_at', o.paid_at,
            'payment_recipient', o.payment_recipient,
            'total', o.total,
            'shipping_cost', o.shipping_cost,
            'fast_delivery_cost', o.fast_delivery_cost,
            'items', coalesce((
              select jsonb_agg(jsonb_build_object(
                'quantity', i.quantity,
                'product_slug', i.product_slug,
                'ring_color', i.ring_color,
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
                'rogalik_charms', i.rogalik_charms
              ) order by i.sort_order, i.created_at)
              from public.order_items i
              where i.order_id = o.id
            ), '[]'::jsonb)
          ) as row_data,
          o.paid_at
          from public.orders o
          where o.paid_at is not null
            and o.status not in ('pending', 'cancelled')
        ) t
      ),
      '[]'::jsonb
    )
  );
end;
$$;
