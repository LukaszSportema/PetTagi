create or replace function public.admin_delete_discount_code(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.discount_codes;
begin
  perform public.assert_admin();

  select * into v_row from public.discount_codes where id = p_id;
  if not found then
    raise exception 'discount code not found';
  end if;

  if v_row.used_at is not null then
    raise exception 'discount code not active';
  end if;

  if v_row.expires_at <= now() then
    raise exception 'discount code not active';
  end if;

  delete from public.discount_codes where id = p_id;
end;
$$;

revoke all on function public.admin_delete_discount_code(uuid) from public;
grant execute on function public.admin_delete_discount_code(uuid) to authenticated;
