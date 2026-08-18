-- PetTagi — odczyt zamówień w panelu administratora (tymczasowo bez logowania)
-- Wklej w Supabase: SQL Editor → Run
-- Po dodaniu autentykacji usuń GRANT dla anon i ogranicz EXECUTE do administratorów.

create or replace function public.admin_list_orders()
returns setof public.orders
language sql
stable
security definer
set search_path = public
as $$
  select * from public.orders order by created_at desc;
$$;

create or replace function public.admin_get_order(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'order', to_jsonb(o),
    'items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.sort_order, i.created_at)
      from public.order_items i
      where i.order_id = o.id
    ), '[]'::jsonb)
  )
  into result
  from public.orders o
  where o.id = p_id;

  return result;
end;
$$;

revoke all on function public.admin_list_orders() from public;
grant execute on function public.admin_list_orders() to anon, authenticated;

revoke all on function public.admin_get_order(uuid) from public;
grant execute on function public.admin_get_order(uuid) to anon, authenticated;
