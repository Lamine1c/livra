-- 046 — N48W · Adresse client FACULTATIVE (décision Lamine, gate ZTE 21/09)
--
-- POURQUOI : en Algérie l'adresse précise n'existe souvent pas (pas de n° de rue, pas de code postal
-- fiable) — le livreur appelle et se fait guider. `wilaya` + `commune` restent OBLIGATOIRES ; l'adresse
-- texte devient facultative. `clients.address` est aujourd'hui `NOT NULL` (001_initial_schema:23) → on
-- relâche la contrainte pour qu'une commande SANS adresse soit valide (address NULL), pas dégradée.
--
-- ⚠️ Côté APPLICATIF, tant que cette migration n'est PAS appliquée : le code continue d'insérer `""`
-- (chaîne vide) quand l'adresse manque (create-order/meta-lead) → satisfait déjà le NOT NULL, zéro
-- rupture. Une fois 046 appliquée, `NULL` devient possible ; les consommateurs (étiquette transporteur)
-- gèrent DÉJÀ `""` ET `NULL` via un repli sur la commune (N48W : yalidine.ts / ecotrack.ts).
--
-- ⚠️ NON appliquée par cc (règle 4). Apply = Lamine via SQL Editor.

ALTER TABLE public.clients ALTER COLUMN address DROP NOT NULL;
