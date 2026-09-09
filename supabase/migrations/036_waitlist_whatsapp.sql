-- Migration: 036_waitlist_whatsapp
-- Waitlist Fondateur nom + WhatsApp.
--
-- Contexte : tant que l'app n'est pas sur les stores, /pricing ne fait plus le
-- signup complet (email -> OTP -> mot de passe). Il collecte uniquement le nom
-- et le numéro WhatsApp du prospect dans vendors_waitlist. Le jour de
-- l'ouverture, on prévient chaque inscrit sur WhatsApp.
--
-- ⚠️ NON appliquée par cc (règle 4 : Supabase = Lamine). À coller dans le
--    SQL Editor Supabase.

-- 1) Colonne WhatsApp (nullable : les anciennes lignes waitlist n'en ont pas).
ALTER TABLE vendors_waitlist
  ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 2) Unicité du WhatsApp parmi les lignes qui en ont un.
--    Index PARTIEL (WHERE whatsapp IS NOT NULL) : les lignes historiques sans
--    WhatsApp (inscription par email) ne violent pas l'unicité. La route
--    /api/waitlist gère l'idempotence côté serveur (insert + capture de la
--    violation 23505 = place déjà réservée), sans dépendre de ON CONFLICT sur
--    un index partiel (non arbitrable par PostgREST).
CREATE UNIQUE INDEX IF NOT EXISTS uq_vendors_waitlist_whatsapp
  ON vendors_waitlist (whatsapp)
  WHERE whatsapp IS NOT NULL;

-- 3) Waitlist sans email : email devient nullable.
--    La contrainte vendors_waitlist_email_unique UNIQUE (email) reste ; en
--    Postgres, les NULL sont DISTINCTS par défaut, donc plusieurs inscrits
--    WhatsApp-only (email NULL) coexistent sans conflit.
ALTER TABLE vendors_waitlist
  ALTER COLUMN email DROP NOT NULL;

COMMENT ON COLUMN vendors_waitlist.email IS
  'Nullable depuis la migration 036 : la waitlist Fondateur (/pricing) collecte
   nom + WhatsApp sans email tant que l app n est pas sur les stores.';

COMMENT ON COLUMN vendors_waitlist.whatsapp IS
  'Numéro WhatsApp DZ au format local 0[567]xxxxxxxx (sans espaces), collecté
   par la waitlist Fondateur /pricing. Unique parmi les lignes non-NULL.';
