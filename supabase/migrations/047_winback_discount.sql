-- 047 — G3W · Geler le taux de remise winback + garder le COD d'origine — NON appliquée
--
-- POURQUOI : quand l'acheteur ACCEPTE l'offre (« إيه نأكد »), la remise doit s'appliquer au COD
-- (orders.total_amount = le montant réel qui part chez Yalidine/Ecotrack/OTP/Trust Layer). Deux besoins :
--  1) `winback_discount_rate` : le taux OFFERT, GELÉ sur la commande AU MOMENT DE L'ENVOI (dans le même
--     UPDATE que winback_sent_at). Sinon, si le vendeur édite sa réponse préparée entre l'envoi et le
--     « Oui », on appliquerait un taux que l'acheteur n'a jamais accepté (la trace WhatsApp prouverait
--     le contraire). Le taux vit sur LA COMMANDE, pas dans prepared_responses (qui est mutable).
--  2) `original_total_amount` : le COD AVANT remise, conservé à l'application (historique — un COD modifié
--     sans trace = une plainte client). Sert aussi de garde d'idempotence (non-null = remise déjà appliquée).
--
-- ⚠️ NON appliquée par cc (règle 4). Apply = Lamine via SQL Editor. ⚠️ PILE EN ATTENTE : 045 + 046 + 047.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS winback_discount_rate  integer
  CHECK (winback_discount_rate IS NULL OR (winback_discount_rate BETWEEN 1 AND 90));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS original_total_amount  numeric;
