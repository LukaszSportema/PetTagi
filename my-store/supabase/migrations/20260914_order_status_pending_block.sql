-- PetTagi — blokada cofania opłaconego zamówienia do statusu pending

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
end;
$$;
