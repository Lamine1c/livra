alter table public.orders
  add column if not exists carrier text;
