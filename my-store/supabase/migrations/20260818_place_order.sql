-- PetTagi — zapis zamówienia z checkoutu
-- Potrzebne, bo RLS blokuje SELECT na orders (INSERT pozycji i numer PT-… nie zadziałają bez tej funkcji).
-- Wklej w Supabase: SQL Editor → Run

create or replace function public.place_order(order_row jsonb, items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  new_order_id text;
begin
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) = 0 then
    raise exception 'items must be a non-empty array';
  end if;

  insert into public.orders (
    client_name,
    client_surname,
    client_email,
    client_phone,
    client_address,
    client_postcode,
    client_city,
    delivery_type,
    inpost_id,
    discount_code,
    products_value,
    shipping_cost,
    fast_delivery,
    fast_delivery_cost,
    payment_recipient,
    total
  )
  values (
    order_row->>'client_name',
    order_row->>'client_surname',
    order_row->>'client_email',
    order_row->>'client_phone',
    order_row->>'client_address',
    order_row->>'client_postcode',
    order_row->>'client_city',
    order_row->>'delivery_type',
    nullif(order_row->>'inpost_id', ''),
    nullif(order_row->>'discount_code', ''),
    coalesce((order_row->>'products_value')::numeric, 0),
    coalesce((order_row->>'shipping_cost')::numeric, 0),
    coalesce((order_row->>'fast_delivery')::boolean, false),
    coalesce((order_row->>'fast_delivery_cost')::numeric, 0),
    nullif(order_row->>'payment_recipient', ''),
    coalesce((order_row->>'total')::numeric, 0)
  )
  returning id, orders.order_id
  into new_id, new_order_id;

  insert into public.order_items (
    order_id,
    sort_order,
    quantity,
    unit_price,
    line_total,
    image_url,
    ring_color,
    base_color,
    base_charms,
    extra_charms,
    base_carabiner,
    extra_carabiner,
    string_premium,
    string_classic,
    dog_neck,
    stoppers,
    sticker,
    dog_name,
    number_on_tag,
    dial_code_info
  )
  select
    new_id,
    coalesce((item->>'sort_order')::integer, 0),
    coalesce((item->>'quantity')::integer, 1),
    coalesce((item->>'unit_price')::numeric, 0),
    coalesce((item->>'line_total')::numeric, 0),
    item->>'image_url',
    item->>'ring_color',
    item->>'base_color',
    item->>'base_charms',
    coalesce(item->'extra_charms', '[]'::jsonb),
    item->>'base_carabiner',
    coalesce(item->'extra_carabiner', '[]'::jsonb),
    coalesce(item->'string_premium', '[]'::jsonb),
    coalesce(item->'string_classic', '[]'::jsonb),
    nullif(item->>'dog_neck', ''),
    nullif(item->>'stoppers', ''),
    nullif(item->>'sticker', ''),
    item->>'dog_name',
    item->>'number_on_tag',
    coalesce((item->>'dial_code_info')::boolean, false)
  from jsonb_array_elements(items) as item;

  return jsonb_build_object('id', new_id, 'order_id', new_order_id);
end;
$$;

revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
