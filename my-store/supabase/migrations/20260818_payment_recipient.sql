-- PetTagi — odbiorca płatności (Wiktoria / Łukasz)
-- Wklej w Supabase: SQL Editor → Run

create table if not exists public.store_settings (
  id text primary key,
  payment_recipient text not null default 'wiktoria',
  updated_at timestamptz not null default now(),
  constraint store_settings_id_default check (id = 'default'),
  constraint store_settings_payment_recipient check (payment_recipient in ('wiktoria', 'lukasz'))
);

insert into public.store_settings (id, payment_recipient)
values ('default', 'wiktoria')
on conflict (id) do nothing;

alter table public.store_settings enable row level security;

create or replace function public.get_payment_recipient()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select payment_recipient from public.store_settings where id = 'default';
$$;

create or replace function public.admin_set_payment_recipient(p_recipient text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_recipient not in ('wiktoria', 'lukasz') then
    raise exception 'invalid payment recipient';
  end if;

  insert into public.store_settings (id, payment_recipient, updated_at)
  values ('default', p_recipient, now())
  on conflict (id) do update
    set payment_recipient = excluded.payment_recipient,
        updated_at = now();

  return p_recipient;
end;
$$;

revoke all on function public.get_payment_recipient() from public;
grant execute on function public.get_payment_recipient() to anon, authenticated;

revoke all on function public.admin_set_payment_recipient(text) from public;
grant execute on function public.admin_set_payment_recipient(text) to anon, authenticated;
