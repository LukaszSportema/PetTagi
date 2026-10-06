-- PetTagi — jednorazowe kody rabatowe (% od ceny bazowej adresówki)

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null,
  admin_comment text,
  percent smallint not null,
  valid_months smallint not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_order_id uuid references public.orders (id) on delete set null,
  constraint discount_codes_code_unique unique (code),
  constraint discount_codes_code_format check (code ~ '^[A-Z]{6}$'),
  constraint discount_codes_label_length check (char_length(label) <= 20),
  constraint discount_codes_comment_length check (
    admin_comment is null or char_length(admin_comment) <= 20
  ),
  constraint discount_codes_percent check (percent in (5, 10, 15, 20)),
  constraint discount_codes_valid_months check (valid_months between 1 and 6)
);

create index discount_codes_code_idx on public.discount_codes (code);
create index discount_codes_created_at_idx on public.discount_codes (created_at desc);

alter table public.discount_codes enable row level security;

create or replace function public.random_discount_code()
returns text
language plpgsql
volatile
as $$
declare
  v_code text := '';
  i integer;
begin
  for i in 1..6 loop
    v_code := v_code || chr(65 + floor(random() * 26)::integer);
  end loop;
  return v_code;
end;
$$;

create or replace function public.admin_list_discount_codes()
returns setof public.discount_codes
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
  select * from public.discount_codes
  order by created_at desc;
end;
$$;

create or replace function public.admin_generate_discount_code(
  p_label text,
  p_valid_months integer,
  p_percent integer
)
returns public.discount_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_label text;
  v_code text;
  v_row public.discount_codes;
  v_attempts integer := 0;
begin
  perform public.assert_admin();

  v_label := left(trim(p_label), 20);
  if v_label = '' then
    raise exception 'label required';
  end if;

  if p_valid_months is null or p_valid_months < 1 or p_valid_months > 6 then
    raise exception 'invalid validity months';
  end if;

  if p_percent is null or p_percent not in (5, 10, 15, 20) then
    raise exception 'invalid percent';
  end if;

  loop
    v_attempts := v_attempts + 1;
    if v_attempts > 50 then
      raise exception 'could not generate unique code';
    end if;
    v_code := public.random_discount_code();
    exit when not exists (select 1 from public.discount_codes d where d.code = v_code);
  end loop;

  insert into public.discount_codes (code, label, percent, valid_months, expires_at)
  values (
    v_code,
    v_label,
    p_percent,
    p_valid_months,
    now() + make_interval(months => p_valid_months)
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.admin_set_discount_code_comment(p_id uuid, p_comment text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment text;
begin
  perform public.assert_admin();
  v_comment := nullif(left(trim(p_comment), 20), '');

  update public.discount_codes
  set admin_comment = v_comment
  where id = p_id;

  if not found then
    raise exception 'discount code not found';
  end if;
end;
$$;

create or replace function public.check_discount_code(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'percent', d.percent,
    'label', d.label,
    'code', d.code
  )
  from public.discount_codes d
  where d.code = upper(trim(p_code))
    and d.used_at is null
    and d.expires_at > now()
  limit 1;
$$;

create or replace function public.place_order(order_row jsonb, items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  new_order_id text;
  v_discount_code text;
begin
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) = 0 then
    raise exception 'items must be a non-empty array';
  end if;

  v_discount_code := nullif(upper(trim(order_row->>'discount_code')), '');

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
    v_discount_code,
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
    product_slug,
    product_name,
    ring_color,
    base_color,
    base_charms,
    extra_charms,
    base_carabiner,
    extra_carabiner,
    string_premium,
    string_classic,
    string_glow,
    dog_neck,
    stoppers,
    sticker,
    dog_name,
    number_on_tag,
    dial_code_info,
    charm_mounting,
    name_layout,
    rogalik_mounting,
    rogalik_cord_color,
    rogalik_beads,
    rogalik_charms
  )
  select
    new_id,
    coalesce((item->>'sort_order')::integer, 0),
    coalesce((item->>'quantity')::integer, 1),
    coalesce((item->>'unit_price')::numeric, 0),
    coalesce((item->>'line_total')::numeric, 0),
    item->>'image_url',
    coalesce(nullif(item->>'product_slug', ''), 'adresowka-bizuteryjna'),
    coalesce(nullif(item->>'product_name', ''), 'Adresówka biżuteryjna'),
    item->>'ring_color',
    item->>'base_color',
    item->>'base_charms',
    coalesce(item->'extra_charms', '[]'::jsonb),
    item->>'base_carabiner',
    coalesce(item->'extra_carabiner', '[]'::jsonb),
    coalesce(item->'string_premium', '[]'::jsonb),
    coalesce(item->'string_classic', '[]'::jsonb),
    coalesce(item->'string_glow', '[]'::jsonb),
    nullif(item->>'dog_neck', ''),
    nullif(item->>'stoppers', ''),
    nullif(item->>'sticker', ''),
    item->>'dog_name',
    item->>'number_on_tag',
    coalesce((item->>'dial_code_info')::boolean, false),
    nullif(item->>'charm_mounting', ''),
    nullif(item->>'name_layout', ''),
    nullif(item->>'rogalik_mounting', ''),
    nullif(item->>'rogalik_cord_color', ''),
    nullif(item->>'rogalik_beads', ''),
    coalesce(item->'rogalik_charms', '[]'::jsonb)
  from jsonb_array_elements(items) as item;

  if v_discount_code is not null then
    update public.discount_codes
    set used_at = now(), used_order_id = new_id
    where code = v_discount_code
      and used_at is null
      and expires_at > now();

    if not found then
      raise exception 'invalid or expired discount code';
    end if;
  end if;

  return jsonb_build_object('id', new_id, 'order_id', new_order_id);
end;
$$;

revoke all on function public.admin_list_discount_codes() from public;
grant execute on function public.admin_list_discount_codes() to authenticated;

revoke all on function public.admin_generate_discount_code(text, integer, integer) from public;
grant execute on function public.admin_generate_discount_code(text, integer, integer) to authenticated;

revoke all on function public.admin_set_discount_code_comment(uuid, text) from public;
grant execute on function public.admin_set_discount_code_comment(uuid, text) to authenticated;

revoke all on function public.check_discount_code(text) from public;
grant execute on function public.check_discount_code(text) to anon, authenticated;

revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
