-- Migration: 034_drivers_terms
-- Preuve d'acceptation CGU + Politique par le LIVREUR (côté serveur). Comble
-- l'asymétrie : le vendeur signe avec preuve horodatée depuis le début, le livreur
-- n'acceptait rien alors que c'est son flow qui envoie du GPS.
--
-- Design (W17, décision Claudy) : l'acceptation VOYAGE avec l'inscription. L'app
-- envoie à /register les versions qu'elle a AFFICHÉES (seule elle le sait) ; register
-- les stocke dans le staging driver_otps ; verify-otp les recopie dans drivers au
-- moment où le row est créé/mis à jour, avec terms_accepted_at = now() serveur.
--
-- PAS d'IP ni de user-agent : le livreur signe depuis l'app, pas un navigateur —
-- minimum qui prouve. Colonnes NULLABLES : un livreur déjà inscrit n'a rien signé,
-- NULL = « n'a pas encore accepté », c'est une information, pas un défaut. On ne
-- fabrique aucune acceptation rétroactive.
--
-- ⚠️ NON appliquée par cc (règle 4). Apply = Lamine via SQL Editor.

-- ─── drivers : la preuve persistante ─────────────────────────────────────────
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version     TEXT,
  ADD COLUMN IF NOT EXISTS privacy_version   TEXT;

-- ─── driver_otps : le staging TRANSPORTE, il ne prouve rien ──────────────────
-- (donc PAS de terms_accepted_at ici : la date de signature n'est posée qu'au
--  moment de la création réelle du livreur, côté verify-otp.)
ALTER TABLE public.driver_otps
  ADD COLUMN IF NOT EXISTS terms_version   TEXT,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT;
