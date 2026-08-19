-- PetTagi — zmiana statusu zamówienia z panelu administratora
-- Wklej w Supabase: SQL Editor → Run

create or replace function public.admin_set_order_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('pending', 'paid', 'processing', 'shipped', 'cancelled') then
    raise exception 'invalid order status';
  end if;

  update public.orders
  set status = p_status::public.order_status
  where id = p_id;

  if not found then
    raise exception 'order not found';
  end if;
end;
$$;

revoke all on function public.admin_set_order_status(uuid, text) from public;
grant execute on function public.admin_set_order_status(uuid, text) to anon, authenticated;
