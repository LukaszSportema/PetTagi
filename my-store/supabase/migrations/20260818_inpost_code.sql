-- PetTagi — kod nadania InPost (nadanie bez etykiety)
-- Wklej w Supabase: SQL Editor → Run

alter table public.orders
  add column if not exists inpost_code text;

create or replace function public.admin_set_inpost_code(p_id uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set inpost_code = nullif(trim(p_code), '')
  where id = p_id;
end;
$$;

revoke all on function public.admin_set_inpost_code(uuid, text) from public;
grant execute on function public.admin_set_inpost_code(uuid, text) to anon, authenticated;
