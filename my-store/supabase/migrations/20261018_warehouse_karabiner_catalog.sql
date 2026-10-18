-- Magazyn: przenieś stany ze starych ID karabińczyków na ID z konfiguratora.

create or replace function public.warehouse_karabiner_stock_id(p_item_id text)
returns text
language sql
immutable
set search_path = public
as $$
  select case btrim(coalesce(p_item_id, ''))
    when 'kolkozlote' then 'kolko20g'
    when 'kolkozlotesrednie' then 'kolko25g'
    when 'kolkozloteduze' then 'kolko28g'
    when 'kolkosrebrne' then 'kolko20s'
    when 'klasyczny' then 'klasyczny20g'
    when 'klasycznysrebrny' then 'klasyczny20s'
    when 'serduszko' then 'serce22g'
    when 'serduszkosrebrne' then 'serce22s'
    when 'duzy' then 'duzy25g'
    when 'duzysrebrny' then 'duzy25s'
    else btrim(p_item_id)
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

do $$
declare
  r record;
  v_new_id text;
  v_add integer;
begin
  for r in
    select *
    from public.warehouse_stock
    where kind = 'karabiner'
      and item_id in (
        'kolkozlote',
        'kolkozlotesrednie',
        'kolkozloteduze',
        'kolkosrebrne',
        'klasyczny',
        'klasycznysrebrny',
        'serduszko',
        'serduszkosrebrne',
        'duzy',
        'duzysrebrny'
      )
  loop
    v_new_id := case r.item_id
      when 'kolkozlote' then 'kolko20g'
      when 'kolkozlotesrednie' then 'kolko25g'
      when 'kolkozloteduze' then 'kolko28g'
      when 'kolkosrebrne' then 'kolko20s'
      when 'klasyczny' then 'klasyczny20g'
      when 'klasycznysrebrny' then 'klasyczny20s'
      when 'serduszko' then 'serce22g'
      when 'serduszkosrebrne' then 'serce22s'
      when 'duzy' then 'duzy25g'
      when 'duzysrebrny' then 'duzy25s'
      else null
    end;

    if v_new_id is null then
      continue;
    end if;

    v_add := greatest(0, least(999, coalesce(r.quantity, 0)));

    insert into public.warehouse_stock (item_id, kind, quantity)
    values (v_new_id, 'karabiner', v_add)
    on conflict (item_id) do update
    set quantity = least(999, public.warehouse_stock.quantity + excluded.quantity),
        kind = 'karabiner',
        updated_at = now();

    delete from public.warehouse_stock where item_id = r.item_id;
  end loop;
end;
$$;
