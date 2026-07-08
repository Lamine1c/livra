-- Migration: 026_billing_trial_gate
-- À appliquer manuellement via Supabase Studio (SQL Editor), comme les autres.
-- Trial gate + founders atomiques :
--   a) index unique partiel sur founder_index (ceinture + bretelles vs 015)
--   b) RPC claim_founder_index(p_email) — attribution ATOMIQUE des 50 founders
--   c) CHECK subscription_status ('trial'|'active'|'expired'|'comped')
--      + colonne trial_ends_at avec backfill
--   d) colonnes reminder_3d_sent_at / reminder_0d_sent_at (crons de rappel)
--   e) RLS RESTRICTIVE sur INSERT orders : vendeur 'expired' (ou trial échu)
--      ne peut plus créer de commande (le mobile INSERT en direct, sans API)

-- ─────────────────────────────────────────────
-- a) UNIQUE INDEX partiel sur founder_index
-- NB : la colonne est déjà UNIQUE (015_vendors_waitlist). Cet index partiel
-- WHERE founder_index IS NOT NULL rend la garantie explicite et robuste même
-- si la contrainte UNIQUE de colonne venait à être retirée.
-- ─────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS vendors_waitlist_founder_index_unique
  ON public.vendors_waitlist (founder_index)
  WHERE founder_index IS NOT NULL;

-- ─────────────────────────────────────────────
-- b) RPC claim_founder_index(p_email) — ATOMIQUE
-- Remplace le count+update applicatif de /api/auth/set-password (race
-- condition : deux activations simultanées pouvaient lire le même count).
-- pg_advisory_xact_lock sérialise les attributions dans la transaction ;
-- le prochain index = max(founder_index)+1 (jamais de collision, même si
-- des index ont été attribués hors du flux count-based historique).
-- Retourne : l'index attribué (ou déjà détenu), NULL si 50 atteints ou
-- email inconnu.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.claim_founder_index(p_email text)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing int;
  v_count    int;
  v_next     int;
BEGIN
  -- Verrou transactionnel (clé constante arbitraire dédiée aux founders).
  PERFORM pg_advisory_xact_lock(682026001);

  SELECT founder_index INTO v_existing
  FROM public.vendors_waitlist
  WHERE email = p_email;

  IF NOT FOUND THEN
    RETURN NULL; -- email inconnu
  END IF;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing; -- déjà founder (idempotent)
  END IF;

  SELECT count(*) INTO v_count
  FROM public.vendors_waitlist
  WHERE founder_index IS NOT NULL;

  IF v_count >= 50 THEN
    RETURN NULL; -- quota founders atteint (< 50 STRICT)
  END IF;

  SELECT COALESCE(max(founder_index), 0) + 1 INTO v_next
  FROM public.vendors_waitlist;

  UPDATE public.vendors_waitlist
  SET founder_index = v_next
  WHERE email = p_email;

  RETURN v_next;
END;
$$;

-- Appelée uniquement côté serveur (service role) — jamais anon/authenticated.
REVOKE ALL ON FUNCTION public.claim_founder_index(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_founder_index(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_founder_index(text) TO service_role;

-- ─────────────────────────────────────────────
-- c) subscription_status : CHECK + trial_ends_at (avec backfill)
-- 025 a créé subscription_status DEFAULT 'trial' sans CHECK.
-- Choix backfill : activated_at existe bien dans vendors_waitlist (015) —
-- c'est la date d'activation du compte (set-password). Le trial démarre à
-- l'activation, fallback created_at (inscription), fallback now().
-- ─────────────────────────────────────────────
ALTER TABLE public.vendors_waitlist
  DROP CONSTRAINT IF EXISTS vendors_waitlist_subscription_status_check;
ALTER TABLE public.vendors_waitlist
  ADD CONSTRAINT vendors_waitlist_subscription_status_check
  CHECK (subscription_status IN ('trial', 'active', 'expired', 'comped'));

ALTER TABLE public.vendors_waitlist
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

UPDATE public.vendors_waitlist
SET trial_ends_at = COALESCE(activated_at, created_at, now()) + interval '7 days'
WHERE trial_ends_at IS NULL;

-- ─────────────────────────────────────────────
-- d) Colonnes idempotence des rappels (cron billing-reminders)
-- ─────────────────────────────────────────────
ALTER TABLE public.vendors_waitlist
  ADD COLUMN IF NOT EXISTS reminder_3d_sent_at timestamptz;
ALTER TABLE public.vendors_waitlist
  ADD COLUMN IF NOT EXISTS reminder_0d_sent_at timestamptz;

-- ─────────────────────────────────────────────
-- e) RLS : blocage création de commande si abonnement expiré
-- Le mobile crée les commandes par INSERT Supabase direct (pas d'API web) —
-- confirmé dans livra-mobile app/(vendor)/orders/new.tsx. Le seul point
-- d'enforcement serveur possible est donc une policy RLS.
-- Fonction SECURITY DEFINER : lit vendors_waitlist via l'email du JWT
-- (auth.jwt()->>'email'). FAIL-OPEN si email absent du JWT ou vendeur
-- inconnu de vendors_waitlist (on ne bloque QUE les 'expired' avérés et les
-- trials échus). La lecture, le tracking et les mises à jour de statut
-- restent totalement ouverts (policy limitée à INSERT, RESTRICTIVE).
-- ─────────────────────────────────────────────
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
BEGIN
  IF v_email = '' THEN
    RETURN true; -- pas d'email dans le JWT (service role, etc.) → ne pas bloquer
  END IF;

  SELECT subscription_status, trial_ends_at
  INTO v_status, v_trial
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

  RETURN true; -- trial en cours, active, comped
END;
$$;

GRANT EXECUTE ON FUNCTION public.vendor_subscription_allows_orders() TO authenticated;

-- Policy RESTRICTIVE : s'AJOUTE (AND) à la policy permissive existante
-- "Users manage own orders" (001). Ne touche pas SELECT/UPDATE/DELETE.
DROP POLICY IF EXISTS "orders_insert_requires_active_subscription" ON public.orders;
CREATE POLICY "orders_insert_requires_active_subscription"
  ON public.orders
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (public.vendor_subscription_allows_orders());
