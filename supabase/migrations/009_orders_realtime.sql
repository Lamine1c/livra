-- Ajouter orders à la publication Realtime pour les live updates côté vendeur.
-- Migration 006 avait ajouté deliveries + delivery_positions, mais pas orders.
-- ⚠️ À exécuter via Supabase Studio → SQL Editor.

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
