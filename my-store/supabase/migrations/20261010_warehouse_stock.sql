-- Magazyn: stany charmsów i karabińczyków

alter table public.orders
  add column if not exists warehouse_stock_applied boolean not null default false;

create table public.warehouse_stock (
  item_id text primary key,
  kind text not null,
  quantity integer not null,
  updated_at timestamptz not null default now(),
  constraint warehouse_stock_kind check (kind in ('charm', 'karabiner')),
  constraint warehouse_stock_quantity check (quantity >= 0 and quantity <= 999)
);

create index warehouse_stock_kind_idx on public.warehouse_stock (kind);

alter table public.warehouse_stock enable row level security;

create or replace function public.list_warehouse_stock()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(item_id, quantity), '{}'::jsonb)
  from public.warehouse_stock;
$$;

create or replace function public.admin_list_warehouse_stock()
returns setof public.warehouse_stock
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query select * from public.warehouse_stock order by kind, item_id;
end;
$$;

create or replace function public.admin_set_warehouse_stock(
  p_item_id text,
  p_kind text,
  p_quantity integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := btrim(p_item_id);
  v_qty integer;
begin
  perform public.assert_admin();

  if v_id = '' then
    raise exception 'item id required';
  end if;

  if p_kind not in ('charm', 'karabiner') then
    raise exception 'invalid kind';
  end if;

  v_qty := coalesce(p_quantity, 0);
  if v_qty < 0 or v_qty > 999 then
    raise exception 'invalid quantity';
  end if;

  insert into public.warehouse_stock (item_id, kind, quantity)
  values (v_id, p_kind, v_qty)
  on conflict (item_id) do update
  set kind = excluded.kind,
      quantity = excluded.quantity,
      updated_at = now();
end;
$$;

create or replace function public.warehouse_apply_paid_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.order_items%rowtype;
  v_qty integer;
  v_charm text;
  v_kar text;
begin
  if not exists (
    select 1 from public.orders o
    where o.id = p_order_id and o.warehouse_stock_applied = false
  ) then
    return;
  end if;

  for r in select * from public.order_items where order_id = p_order_id
  loop
    v_qty := greatest(1, coalesce(r.quantity, 1));

    if r.base_charms is not null and btrim(r.base_charms) <> '' and btrim(r.base_charms) <> '-' then
      update public.warehouse_stock
      set quantity = greatest(0, quantity - v_qty), updated_at = now()
      where item_id = btrim(r.base_charms) and kind = 'charm';
    end if;

    for v_charm in select jsonb_array_elements_text(r.extra_charms)
    loop
      if btrim(v_charm) = '' then continue; end if;
      update public.warehouse_stock
      set quantity = greatest(0, quantity - v_qty), updated_at = now()
      where item_id = btrim(v_charm) and kind = 'charm';
    end loop;

    for v_charm in select jsonb_array_elements_text(r.rogalik_charms)
    loop
      if btrim(v_charm) = '' then continue; end if;
      update public.warehouse_stock
      set quantity = greatest(0, quantity - v_qty), updated_at = now()
      where item_id = btrim(v_charm) and kind = 'charm';
    end loop;

    if r.base_carabiner is not null and btrim(r.base_carabiner) <> '' and btrim(r.base_carabiner) <> '-' then
      update public.warehouse_stock
      set quantity = greatest(0, quantity - v_qty), updated_at = now()
      where item_id = btrim(r.base_carabiner) and kind = 'karabiner';
    end if;

    for v_kar in select jsonb_array_elements_text(r.extra_carabiner)
    loop
      if btrim(v_kar) = '' then continue; end if;
      update public.warehouse_stock
      set quantity = greatest(0, quantity - v_qty), updated_at = now()
      where item_id = btrim(v_kar) and kind = 'karabiner';
    end loop;
  end loop;

  update public.orders
  set warehouse_stock_applied = true
  where id = p_order_id;
end;
$$;

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
  set status = p_status::public.order_status
  where id = p_id;

  if p_status = 'paid' and current_status is distinct from 'paid'::public.order_status then
    perform public.warehouse_apply_paid_order(p_id);
  end if;
end;
$$;

revoke all on function public.list_warehouse_stock() from public;
grant execute on function public.list_warehouse_stock() to anon, authenticated;

revoke all on function public.admin_list_warehouse_stock() from public;
grant execute on function public.admin_list_warehouse_stock() to authenticated;

revoke all on function public.admin_set_warehouse_stock(text, text, integer) from public;
grant execute on function public.admin_set_warehouse_stock(text, text, integer) to authenticated;
