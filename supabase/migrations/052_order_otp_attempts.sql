-- 052_order_otp_attempts.sql
-- [T0A-1] Plafond DURABLE d'essais de code OTP acheteur.
--
-- CONTEXTE : l'OTP du tunnel acheteur passe de 10 min à 24 h (fenêtre de session
-- WhatsApp). Un code à 6 chiffres (10^6) valable 24 h se brute-force si rien ne
-- borne les essais. Le seul garde-fou existant (lib/rate-limit.ts) est EN MÉMOIRE :
-- sur Vercel (instances éphémères, Map non partagée entre lambdas/cold starts) il
-- ne garantit rien. On persiste donc le compteur d'essais SUR LA COMMANDE.
--
-- ⚠️ MIGRATION NON APPLIQUÉE PAR CC — Lamine l'applique dans le SQL Editor.
--   Le code (verify-otp, confirm-order) tolère l'absence de cette colonne/RPC :
--   tant que 052 n'est pas appliquée, la RPC n'existe pas → l'appel échoue → repli
--   sur le comportement actuel (aucun blocage durable). ZÉRO régression à l'attente.

-- 1) Colonne compteur (idempotent).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS otp_attempts integer NOT NULL DEFAULT 0;

-- 2) RPC atomique : incrémente le compteur d'une commande et renvoie la nouvelle
--    valeur. Un seul round-trip, pas de read-modify-write côté app (pas de race).
--    SECURITY DEFINER : appelable aussi bien par le client RLS du vendeur
--    (verify-otp) que par le service role (confirm-order inbound). L'ownership est
--    déjà vérifié par l'appelant AVANT (verify-otp filtre .eq(user_id) ; l'inbound
--    ne matche que des commandes du numéro entrant) — la RPC ne fait qu'incrémenter
--    un entier pour un id connu, surface d'abus négligeable.
CREATE OR REPLACE FUNCTION public.register_otp_attempt(p_order_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.orders
  SET otp_attempts = COALESCE(otp_attempts, 0) + 1
  WHERE id = p_order_id
  RETURNING otp_attempts;
$$;

GRANT EXECUTE ON FUNCTION public.register_otp_attempt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_otp_attempt(uuid) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK (si besoin) :
--   DROP FUNCTION IF EXISTS public.register_otp_attempt(uuid);
--   ALTER TABLE public.orders DROP COLUMN IF EXISTS otp_attempts;
-- ─────────────────────────────────────────────────────────────────────────────
