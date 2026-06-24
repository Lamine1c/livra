-- Étend la contrainte CHECK de orders.delivery_mode (migration 005 = moto_perso/yalidine
-- seulement) pour autoriser les transporteurs Ecotrack (dhd, anderson). Sans ça, créer un
-- bon DHD/Anderson échoue côté DB ("erreur de sauvegarde").
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_mode_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_delivery_mode_check
  CHECK (delivery_mode IS NULL OR delivery_mode IN ('moto_perso','yalidine','dhd','anderson'));
