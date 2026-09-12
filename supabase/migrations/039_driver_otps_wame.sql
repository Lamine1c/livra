-- 039 — N6 WAME-INVERSE · inscription livreur par wa.me (le livreur écrit à LIVRA)
--
-- POURQUOI : au lieu que LIVRA envoie l'OTP dès /register (business-initiated, souvent hors
-- fenêtre 24h → non délivré), le livreur clique un lien wa.me et ÉCRIT à LIVRA « LIVRA <token> » ;
-- son message entrant OUVRE la fenêtre 24h → on répond le code en MESSAGE LIBRE (délivré).
--
-- L'inscription en attente vit dans `driver_otps` (déjà la table de staging, onConflict whatsapp).
-- On ajoute 4 colonnes NULLABLES (donc ADDITIVES — zéro impact sur l'ancien flux ni sur les lignes
-- existantes) :
--   · wa_token             : token court (6-8 alphanum MAJ) mis dans le lien wa.me, sert à retrouver
--                            l'inscription au message entrant. NULL pour l'ancien flux.
--   · wa_token_expires_at  : TTL 24h du token (fenêtre pendant laquelle le livreur peut écrire).
--                            Distinct de `expires_at` (qui reste le TTL 10min de l'OTP une fois envoyé).
--   · wa_send_count        : anti-spam — nb d'OTP envoyés dans la fenêtre courante.
--   · wa_send_window_start : début de la fenêtre glissante (fixe 1h) de l'anti-spam.
--
-- ⚠️ NE PAS appliquer via un outil — Lamine l'exécute dans le SQL Editor Supabase.
-- ADDITIVE uniquement. RÉTRO-COMPAT : l'ancien flux /register ne touche AUCUNE de ces colonnes
-- (elles ne sont écrites que sur la branche wa.me, gatée par un flag) → /register reste fonctionnel
-- même AVANT l'application de cette migration.

ALTER TABLE public.driver_otps
  ADD COLUMN IF NOT EXISTS wa_token             TEXT,
  ADD COLUMN IF NOT EXISTS wa_token_expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wa_send_count        INTEGER,
  ADD COLUMN IF NOT EXISTS wa_send_window_start TIMESTAMPTZ;

-- Lookup du token au message entrant (partiel : seules les inscriptions wa.me en attente).
CREATE UNIQUE INDEX IF NOT EXISTS uq_driver_otps_wa_token
  ON public.driver_otps (wa_token)
  WHERE wa_token IS NOT NULL;
