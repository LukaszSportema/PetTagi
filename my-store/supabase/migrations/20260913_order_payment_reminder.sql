-- PetTagi — przypomnienie o nieopłaconym zamówieniu po 24h

alter table public.orders
  add column if not exists payment_reminder_sent_at timestamptz;

create index if not exists orders_payment_reminder_pending_idx
  on public.orders (created_at)
  where status = 'pending' and payment_reminder_sent_at is null;
