-- PetTagi — edycja numeru telefonu klienta w panelu admina

create or replace function public.admin_set_client_phone(p_id uuid, p_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();

  if nullif(trim(p_phone), '') is null then
    raise exception 'phone required';
  end if;

  update public.orders
  set client_phone = trim(p_phone)
  where id = p_id;

  if not found then
    raise exception 'order not found';
  end if;
end;
$$;

revoke all on function public.admin_set_client_phone(uuid, text) from public;
grant execute on function public.admin_set_client_phone(uuid, text) to authenticated;
