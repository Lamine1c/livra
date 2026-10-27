-- [T3-3] Créneau choisi par l'ACHETEUR après un refus « pas disponible » (not_available) :
-- demain / après-demain / contacter la boutique. Aujourd'hui ce choix n'est stocké NULLE PART → le
-- vendeur reçoit la notif mais ne retrouve rien sur la commande. On le pose SUR la commande.
--
-- ⚠️ À appliquer via Supabase Studio → SQL Editor (PAS supabase db push). NON appliquée automatiquement
-- (gate Lamine). ADD COLUMN nullable, ZÉRO backfill. Tant qu'elle n'est pas appliquée, l'écriture côté
-- code (refusal-reply.ts) est best-effort TOLÉRANTE (colonne absente → erreur ignorée) → zéro régression.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS buyer_availability_choice text,
  ADD COLUMN IF NOT EXISTS buyer_availability_date   date;

-- Valeurs attendues :
--   buyer_availability_choice ∈ { 'tomorrow', 'day_after', 'contact' } (ou NULL = pas de choix exprimé)
--   buyer_availability_date   = date réelle de livraison souhaitée (heure d'Alger, YYYY-MM-DD),
--                               NULL pour 'contact' (ou tant qu'aucun créneau n'est choisi).
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_buyer_availability_choice_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_buyer_availability_choice_check
  CHECK (buyer_availability_choice IS NULL
         OR buyer_availability_choice IN ('tomorrow', 'day_after', 'contact'));

-- Rollback : ALTER TABLE public.orders DROP COLUMN IF EXISTS buyer_availability_choice, DROP COLUMN IF EXISTS buyer_availability_date;
