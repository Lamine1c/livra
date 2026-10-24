-- 051_billing_paid_until_gate.sql
-- [T0A-2] Un abonnement payé n'expirait JAMAIS côté RLS.
--
-- CONTEXTE : le webhook billing crédite `paid_until` (now()+30j) et pose
-- subscription_status='active', mais la fonction `vendor_subscription_allows_orders`
-- (migration 026) ne compare JAMAIS `paid_until` à now() : un 'active' passait le
-- gate INSERT orders à vie, même paiement expiré. On aligne la fonction sur la règle
-- applicative (billing-guard.ts, billing/status) : 'active' autorisé seulement si
-- paid_until > now().
--
-- ⚠️ EXEMPTION — 'active' + paid_until IS NULL : fondateurs, comptes passés à la
-- main, comped historiques. Décision Lamine : NE JAMAIS couper en silence sur une
-- absence de date. La fonction RETURN true dans ce cas (fail-open ciblé).
-- Avant d'APPLIQUER, Lamine compte ces comptes (requête au RAPPORT T0A-2) :
--   SELECT count(*) FROM public.vendors_waitlist
--   WHERE subscription_status = 'active' AND paid_until IS NULL;
--
-- ⚠️ MIGRATION NON APPLIQUÉE PAR CC — Lamine l'applique dans le SQL Editor.
--   Les fixes applicatifs (billing-guard.ts, billing/status) bloquent déjà les
--   actions « argent » (send-otp, verify-otp, confirmation) d'un abonnement échu,
--   indépendamment de cette migration. 051 ferme le dernier trou : le gate INSERT
--   RLS côté DB (mobile en direct). Peut être appliquée après le déploiement du code.

CREATE OR REPLACE FUNCTION public.vendor_subscription_allows_orders()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email  text := lower(coalesce(auth.jwt()->>'email', ''));
  v_status text;
  v_trial  timestamptz;
  v_paid   timestamptz;
BEGIN
  IF v_email = '' THEN
    RETURN true; -- pas d'email dans le JWT (service role, etc.) → ne pas bloquer
  END IF;

  SELECT subscription_status, trial_ends_at, paid_until
  INTO v_status, v_trial, v_paid
  FROM public.vendors_waitlist
  WHERE lower(email) = v_email
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN true; -- vendeur hors vendors_waitlist → ne pas bloquer
  END IF;

  IF v_status = 'expired' THEN
    RETURN false;
  END IF;

  -- Trial échu mais pas encore persisté 'expired' → même verdict que l'API.
  IF v_status = 'trial' AND v_trial IS NOT NULL AND v_trial <= now() THEN
    RETURN false;
  END IF;

  -- [T0A-2] Abonnement payé échu → bloqué. Exemption 'active' + paid_until NULL
  -- (fondateur/manuel/comped) : v_paid IS NULL → la condition est fausse → RETURN true.
  IF v_status = 'active' AND v_paid IS NOT NULL AND v_paid <= now() THEN
    RETURN false;
  END IF;

  RETURN true; -- trial en cours, active valide (ou sans date), comped
END;
$$;

GRANT EXECUTE ON FUNCTION public.vendor_subscription_allows_orders() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK : réappliquer la version 026 de la fonction (sans la clause paid_until).
-- Le corps exact est dans supabase/migrations/026_billing_trial_gate.sql (l.121-158).
-- ─────────────────────────────────────────────────────────────────────────────
