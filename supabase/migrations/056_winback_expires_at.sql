-- 056 — T0D-3 · Échéance de l'offre winback (« oui » tardif = pas de remise).
--
-- CONTEXTE (gate device 24/10) : l'offre de rattrapage affiche une date limite ({{4}} du template
-- order_winback_offer, validity_days, défaut 3 j) mais celle-ci n'était NI stockée NI appliquée →
-- rien n'empêchait un « oui » au jour 10 de déclencher la remise. On persiste l'échéance à l'envoi ;
-- refusal-reply refuse la remise si le « oui » arrive après (texte libre à l'acheteur + notif vendeur).
--
-- Additif pur, nullable → les commandes existantes ont winback_expires_at NULL = « pas d'échéance »
-- = jamais expiré (comportement actuel). Zéro migration de données.
--
-- ⚠️ NON appliquée par cc (règle 4). Apply = Lamine via SQL Editor. Le code (decision/refusal-reply)
--   tolère l'absence de la colonne : écriture best-effort (erreur ignorée), lecture séparée tolérante
--   → tant que 056 n'est pas appliquée, aucun « oui » n'est refusé (zéro régression). PILE : 045→056.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS winback_expires_at timestamptz;

-- ROLLBACK : ALTER TABLE public.orders DROP COLUMN IF EXISTS winback_expires_at;
