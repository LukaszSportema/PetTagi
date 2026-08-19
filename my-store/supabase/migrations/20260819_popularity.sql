-- PetTagi — dane do zakładki Najpopularniejsze w panelu administratora
-- Wklej w Supabase: SQL Editor → Run

create or replace function public.admin_popularity_items()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_agg(row_data order by created_at)
      from (
        select jsonb_build_object(
          'created_at', o.created_at,
          'quantity', i.quantity,
          'ring_color', i.ring_color,
          'base_color', i.base_color,
          'base_charms', i.base_charms,
          'extra_charms', i.extra_charms,
          'base_carabiner', i.base_carabiner,
          'extra_carabiner', i.extra_carabiner,
          'string_classic', i.string_classic,
          'string_premium', i.string_premium,
          'stoppers', i.stoppers,
          'sticker', i.sticker
        ) as row_data,
        o.created_at
        from public.orders o
        join public.order_items i on i.order_id = o.id
        where o.status not in ('pending', 'cancelled')
      ) t
    ),
    '[]'::jsonb
  );
$$;

revoke all on function public.admin_popularity_items() from public;
grant execute on function public.admin_popularity_items() to anon, authenticated;
