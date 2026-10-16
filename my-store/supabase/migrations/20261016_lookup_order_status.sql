-- Publiczny lookup statusu zamówienia (e-mail + numer PT-…), bez ujawniania innych pól.

create or replace function public.lookup_order_status(p_email text, p_order_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_order_id text := upper(trim(p_order_id));
  v_row public.orders;
begin
  if v_email = '' or v_order_id = '' or strpos(v_email, '@') = 0 then
    return jsonb_build_object('found', false);
  end if;

  select * into v_row
  from public.orders o
  where lower(trim(o.client_email)) = v_email
    and upper(trim(o.order_id)) = v_order_id;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  return jsonb_build_object(
    'found', true,
    'status', v_row.status::text,
    'fast_delivery', v_row.fast_delivery,
    'created_at', v_row.created_at
  );
end;
$$;

revoke all on function public.lookup_order_status(text, text) from public;
grant execute on function public.lookup_order_status(text, text) to anon, authenticated;
