-- Magazyn: naklejka premium (Pupil 1, id „1”).

alter table public.warehouse_stock drop constraint if exists warehouse_stock_kind;

alter table public.warehouse_stock
  add constraint warehouse_stock_kind check (kind in ('charm', 'karabiner', 'sticker'));

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

  if p_kind not in ('charm', 'karabiner', 'sticker') then
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
  v_kar_id text;
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

    if r.sticker is not null and btrim(r.sticker) <> '' then
      update public.warehouse_stock
      set quantity = greatest(0, quantity - v_qty), updated_at = now()
      where item_id = btrim(r.sticker) and kind = 'sticker';
    end if;

    if r.base_carabiner is not null and btrim(r.base_carabiner) <> '' and btrim(r.base_carabiner) <> '-' then
      v_kar_id := public.warehouse_karabiner_stock_id(r.base_carabiner);
      update public.warehouse_stock
      set quantity = greatest(0, quantity - v_qty), updated_at = now()
      where item_id = v_kar_id and kind = 'karabiner';
    end if;

    for v_kar in select jsonb_array_elements_text(r.extra_carabiner)
    loop
      if btrim(v_kar) = '' then continue; end if;
      v_kar_id := public.warehouse_karabiner_stock_id(v_kar);
      update public.warehouse_stock
      set quantity = greatest(0, quantity - v_qty), updated_at = now()
      where item_id = v_kar_id and kind = 'karabiner';
    end loop;
  end loop;

  update public.orders
  set warehouse_stock_applied = true
  where id = p_order_id;
end;
$$;
