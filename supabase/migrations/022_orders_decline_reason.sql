-- 022_orders_decline_reason.sql
-- Capture la raison du refus client dans le tunnel anti-scam WhatsApp (branche NON).
-- Alimentée par handleInboundReply (confirm-order.ts) :
--   not_available  → client pas disponible (MSG 5, report)
--   changed_mind   → client a changé d'avis (MSG 6, commande annulée)
--   found_cheaper  → a trouvé moins cher ailleurs (MSG 7, tentative de récup)
-- Affichée côté vendeur (orders/[id].tsx) + fondation du dashboard objections (V2.15).
-- Additive, non-breaking : colonne nullable, aucun impact sur le code existant.

alter table public.orders
  add column if not exists decline_reason text;
