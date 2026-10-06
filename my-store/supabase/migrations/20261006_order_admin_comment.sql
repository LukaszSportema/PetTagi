-- PetTagi — komentarz administratora przy zamówieniu (lista w panelu)

alter table public.orders
  add column if not exists admin_comment text;

alter table public.orders
  drop constraint if exists orders_admin_comment_length;

alter table public.orders
  add constraint orders_admin_comment_length check (
    admin_comment is null or char_length(admin_comment) <= 120
  );

create or replace function public.admin_set_order_comment(p_id uuid, p_comment text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment text;
begin
  perform public.assert_admin();

  v_comment := nullif(trim(p_comment), '');

  if v_comment is not null and char_length(v_comment) > 120 then
    raise exception 'comment too long';
  end if;

  update public.orders
  set admin_comment = v_comment
  where id = p_id;

  if not found then
    raise exception 'order not found';
  end if;
end;
$$;

revoke all on function public.admin_set_order_comment(uuid, text) from public;
grant execute on function public.admin_set_order_comment(uuid, text) to authenticated;
