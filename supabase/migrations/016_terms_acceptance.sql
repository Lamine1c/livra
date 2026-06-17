-- Migration: 016_terms_acceptance
-- Preuve d'acceptation contractuelle (CGU + Privacy) au moment de l'inscription Vendeur.
-- Table active V1 du flow signup vendeur : public.vendors_waitlist (cf. migration 015).

ALTER TABLE vendors_waitlist
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT,
  ADD COLUMN IF NOT EXISTS terms_ip INET,
  ADD COLUMN IF NOT EXISTS terms_user_agent TEXT;

COMMENT ON COLUMN vendors_waitlist.terms_accepted_at IS
  'Horodatage UTC de l acceptation expresse des CGU et de la
   Privacy par le Vendeur lors de l inscription. Preuve opposable
   conservee 5 ans apres resiliation (CGU art. 2.3).';
