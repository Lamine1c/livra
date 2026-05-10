ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS buyer_lat double precision,
  ADD COLUMN IF NOT EXISTS buyer_lng double precision,
  ADD COLUMN IF NOT EXISTS buyer_location_at timestamptz;
