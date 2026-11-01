-- Ręczna korekta daty opłacenia zamówienia (panel admina)

create or replace function public.admin_set_paid_at(p_id uuid, p_paid_at timestamptz)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.order_status;
  result timestamptz;
begin
  perform public.assert_admin();

  if p_paid_at is null then
    raise exception 'paid_at required';
  end if;

  select status
  into v_status
  from public.orders
  where id = p_id;

  if not found then
    raise exception 'order not found';
  end if;

  if v_status in ('pending', 'cancelled') then
    raise exception 'cannot set paid_at for pending or cancelled order';
  end if;

  update public.orders
  set paid_at = p_paid_at
  where id = p_id
  returning paid_at into result;

  return result;
end;
$$;

revoke all on function public.admin_set_paid_at(uuid, timestamptz) from public;
grant execute on function public.admin_set_paid_at(uuid, timestamptz) to authenticated;
