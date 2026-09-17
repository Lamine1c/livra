-- 041 — N30W.2 · Historique des statuts commande (dates de la timeline) + created_at inbound events
--
-- POURQUOI : la timeline de commande (côté détail) n'a PAS de dates d'étapes — aucun historique de
-- statuts n'est conservé. On enregistre chaque CHANGEMENT RÉEL de `orders.status` dans une table dédiée
-- → le détail commande peut afficher « confirmée le …, en livraison le …, livrée le … ».
--
-- ⚠️ NE PAS appliquer via un outil — Lamine l'exécute dans le SQL Editor Supabase. ADDITIVE :
-- nouvelle table + trigger + colonne nullable → zéro impact sur l'existant. Le code lit l'historique
-- de façon best-effort (champ additif VIDE tant que cette migration n'est pas appliquée → zéro breaking).

-- ─── A) order_status_history ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order
  ON public.order_status_history (order_id, created_at);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
-- service_role gère tout ; le vendeur lit l'historique de SES commandes (via join orders.user_id).
CREATE POLICY "order_status_history_service_role_all" ON public.order_status_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "order_status_history_owner_select" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_status_history.order_id AND o.user_id = auth.uid()
  ));

-- ─── B) Trigger : n'écrit QUE sur un CHANGEMENT RÉEL de statut ────────────────
-- INSERT d'une commande → 1re ligne (le statut initial). UPDATE → une ligne UNIQUEMENT si
-- NEW.status <> OLD.status (jamais sur un update qui ne touche pas le statut → pas de bruit).
CREATE OR REPLACE FUNCTION public.record_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.order_status_history (order_id, status) VALUES (NEW.id, NEW.status);
  ELSIF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.order_status_history (order_id, status) VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_order_status_change ON public.orders;
CREATE TRIGGER trg_record_order_status_change
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.record_order_status_change();

-- ─── C) whatsapp_inbound_events sans created_at → colonne + default now() ─────
ALTER TABLE public.whatsapp_inbound_events
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
