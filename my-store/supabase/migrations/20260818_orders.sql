-- PetTagi — orders + order_items
-- Wklej w Supabase: SQL Editor → Run

create extension if not exists "pgcrypto";

create type public.order_status as enum (
  'pending',
  'paid',
  'processing',
  'shipped',
  'completed',
  'cancelled'
);

create sequence public.order_id_seq;

create function public.generate_order_id()
returns text
language plpgsql
as $$
begin
  return 'PT-' || to_char(timezone('Europe/Warsaw', now()), 'YYYYMMDD')
    || '-' || lpad(nextval('public.order_id_seq')::text, 4, '0');
end;
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique default public.generate_order_id(),
  user_id uuid references auth.users (id) on delete set null,
  client_name text not null,
  client_surname text not null,
  client_email text not null,
  client_phone text not null,
  client_address text not null,
  client_postcode text not null,
  client_city text not null,
  delivery_type text not null,
  inpost_id text,
  discount_code text,
  status public.order_status not null default 'pending',
  products_value numeric(10, 2) not null default 0,
  shipping_cost numeric(10, 2) not null default 0,
  fast_delivery boolean not null default false,
  fast_delivery_cost numeric(10, 2) not null default 0,
  payment_recipient text,
  total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_delivery_type check (delivery_type in ('paczkomat', 'kurier')),
  constraint orders_payment_recipient check (
    payment_recipient is null or payment_recipient in ('wiktoria', 'lukasz')
  ),
  constraint orders_inpost_required_for_paczkomat check (
    delivery_type <> 'paczkomat' or (inpost_id is not null and length(trim(inpost_id)) > 0)
  )
);

create index orders_client_email_idx on public.orders (client_email);
create index orders_inpost_id_idx on public.orders (inpost_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_user_id_idx on public.orders (user_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row
  execute procedure public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  sort_order integer not null default 0,
  quantity integer not null default 1,
  unit_price numeric(10, 2) not null default 0,
  line_total numeric(10, 2) not null default 0,
  image_url text,
  ring_color text not null,
  base_color text not null,
  base_charms text not null,
  extra_charms jsonb not null default '[]'::jsonb,
  base_carabiner text not null,
  extra_carabiner jsonb not null default '[]'::jsonb,
  string_premium jsonb not null default '[]'::jsonb,
  string_classic jsonb not null default '[]'::jsonb,
  dog_neck text,
  stoppers text,
  sticker text,
  dog_name text not null,
  number_on_tag text not null,
  dial_code_info boolean not null default false,
  created_at timestamptz not null default now(),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_extra_charms_array check (jsonb_typeof(extra_charms) = 'array'),
  constraint order_items_extra_carabiner_array check (jsonb_typeof(extra_carabiner) = 'array'),
  constraint order_items_string_premium_array check (jsonb_typeof(string_premium) = 'array'),
  constraint order_items_string_classic_array check (jsonb_typeof(string_classic) = 'array')
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_dog_name_idx on public.order_items (dog_name);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "orders_insert_client"
  on public.orders
  for insert
  to anon, authenticated
  with check (true);

create policy "orders_select_admin"
  on public.orders
  for select
  to authenticated
  using (public.is_admin());

create policy "order_items_insert_client"
  on public.order_items
  for insert
  to anon, authenticated
  with check (exists (select 1 from public.orders o where o.id = order_items.order_id));

create policy "order_items_select_admin"
  on public.order_items
  for select
  to authenticated
  using (public.is_admin());

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
