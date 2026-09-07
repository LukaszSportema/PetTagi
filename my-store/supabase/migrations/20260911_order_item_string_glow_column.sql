-- Brakująca kolumna string_glow (popularność, przychody, place_order)

alter table public.order_items
  add column if not exists string_glow jsonb not null default '[]'::jsonb;

alter table public.order_items
  drop constraint if exists order_items_string_glow_array;

alter table public.order_items
  add constraint order_items_string_glow_array check (jsonb_typeof(string_glow) = 'array');
