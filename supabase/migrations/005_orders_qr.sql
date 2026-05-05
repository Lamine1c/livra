-- QR Smart Delivery — colonnes livreur moto_perso
-- Apply via Supabase Studio SQL Editor

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_mode text
    CHECK (delivery_mode IN ('moto_perso', 'yalidine')),
  ADD COLUMN IF NOT EXISTS qr_token      text UNIQUE,
  ADD COLUMN IF NOT EXISTS driver_id     uuid,       -- TODO: FK vers drivers quand RLS activé
  ADD COLUMN IF NOT EXISTS picked_up_at  timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at  timestamptz;

CREATE INDEX IF NOT EXISTS orders_status_idx   ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_vendor_idx   ON public.orders(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS orders_qr_token_idx
  ON public.orders(qr_token)
  WHERE qr_token IS NOT NULL;
