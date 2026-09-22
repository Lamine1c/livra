-- 050 — G8W-S3 · Snapshot ADRESSE de livraison PAR COMMANDE (sans réécrire le client) — NON appliquée
--
-- POURQUOI : `wilaya`/`commune`/`adresse` vivent sur `clients`, table PARTAGÉE par toutes les commandes
-- du client. « Corriger l'adresse de CETTE commande » réécrivait l'adresse de TOUTES ses commandes (y
-- compris livrées → historique faux). En DZ un client commande depuis plusieurs endroits (maison, travail,
-- café) : le snapshot par commande est la norme, pas l'exception.
--
-- RÈGLE DE LECTURE (helper orderDeliveryAddress) : snapshot s'il existe, SINON le client. → migration
-- INERTE : appliquée ou pas, RIEN ne change tant que personne n'édite (colonnes NULL → repli client).
--
-- ⚠️ TÉLÉPHONE EXCLU de ce lot (STOP ④) : le routage WhatsApp entrant (boucle de refus, OTP, boutons)
-- retrouve le client via `clients.phone_normalized`. Un numéro snapshoté sur la commande mais pas sur le
-- client casserait la reconnaissance de l'acheteur qui répond. Le téléphone sera sa PROPRE tranche.
--
-- ⚠️ NON appliquée par cc (règle 4). Apply = Lamine via SQL Editor. ⚠️ PILE : 045→050.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ship_wilaya  text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ship_commune text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ship_address text;
