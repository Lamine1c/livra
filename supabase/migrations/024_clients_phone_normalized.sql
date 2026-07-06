-- Migration: 024_clients_phone_normalized
-- Colonne + index pour l'agrégat CROSS-VENDEUR du score de fiabilité client.
-- clients est par-vendeur → même numéro = plusieurs lignes. On matche sur un numéro
-- NORMALISÉ (répliquant normalizePhoneNumber de src/lib/whatsapp.ts, formats DZ).
-- Écriture applicative : phone_normalized est renseigné à chaque insert clients.
-- Ce fichier fait le backfill des lignes existantes + pose l'index.

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone_normalized text;

-- Backfill — même logique que normalizePhoneNumber() :
--   +XXXX / 00XXXX → on retire le préfixe ; 0XXXXXXXXX (10) → 213 + reste ; 9 chiffres → 213 + ;
--   sinon → chiffres bruts. (Le '+' est déjà retiré par regexp_replace des non-chiffres.)
UPDATE public.clients
SET phone_normalized = (
  SELECT CASE
    WHEN d = '' THEN NULL
    WHEN left(d, 2) = '00' THEN substring(d FROM 3)
    WHEN left(d, 1) = '0' AND length(d) = 10 THEN '213' || substring(d FROM 2)
    WHEN length(d) = 9 THEN '213' || d
    ELSE d
  END
  FROM (SELECT regexp_replace(coalesce(phone, ''), '\D', '', 'g') AS d) sub
)
WHERE phone IS NOT NULL AND phone <> '';

CREATE INDEX IF NOT EXISTS idx_clients_phone_normalized ON public.clients(phone_normalized);
