-- Metadane kodu rabatowego dla panelu admina (szczegóły zamówienia)

create or replace function public.admin_lookup_discount_code(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_code));
  v_row public.discount_codes;
begin
  perform public.assert_admin();

  select * into v_row from public.discount_codes where code = v_code;
  if not found then
    return null;
  end if;

  return jsonb_build_object('label', v_row.label, 'percent', v_row.percent);
end;
$$;
