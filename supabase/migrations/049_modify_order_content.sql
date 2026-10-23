-- 049 — G7W-S2 · Modifier le CONTENU d'une commande (produit/quantité) + recalcul COHÉRENT du COD,
-- ATOMIQUEMENT (une seule transaction). NON appliquée.
--
-- POURQUOI UNE FONCTION : changer les lignes ET le montant = plusieurs écritures. Une demi-écriture
-- (lignes changées mais montant pas, ou l'inverse) = de l'argent incohérent = pire qu'un refus. Une
-- fonction plpgsql s'exécute dans UNE transaction → tout ou rien.
--
-- SÉCURITÉ : SECURITY INVOKER (défaut) → la fonction s'exécute avec la RLS du vendeur appelant
-- (auth.uid()). Le SELECT ... FOR UPDATE ne voit que SES commandes (sinon `not_found`), et pose un
-- verrou ligne → anti-course contre une expédition concurrente. Aucun contournement de RLS.
--
-- FORMULE QUI FAIT FOI : total_amount = Σ(quantity × unit_price) des lignes (HORS frais — delivery_fee
-- vit à part, inchangé). C'est le CONTENU qui gagne : une remise manuelle antérieure (G5W) est écrasée,
-- car elle portait sur l'ANCIEN contenu ; le vendeur peut re-négocier le prix via adjust-amount ensuite.
-- `original_total_amount` (1er COD) est PRÉSERVÉ (coalesce, compat G3W/G5W). La modif est TRACÉE (048).
--
-- BORNE : pré-expédition (pending/pending_confirmation/confirmed/processing) ET **aucune étiquette générée**
-- (tracking_number transporteur OU qr_token bon moto) → modifier le contenu derrière un bon imprimé = un
-- colis qui ne correspond plus. On BLOQUE (`label_generated`) plutôt qu'approximer.
--
-- ⚠️ NON appliquée par cc (règle 4). Apply = Lamine via SQL Editor. ⚠️ PILE : 045→049.

CREATE OR REPLACE FUNCTION public.modify_order_content(
  p_order_id uuid,
  p_items    jsonb,   -- [{"product_name":text,"quantity":int,"unit_price":numeric}, ...]
  p_reason   text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_order    record;
  v_new_total numeric(12,2);
  v_pre_ship text[] := ARRAY['pending','pending_confirmation','confirmed','processing'];
BEGIN
  SELECT id, status, total_amount, tracking_number, qr_token
    INTO v_order
    FROM public.orders
   WHERE id = p_order_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF NOT (v_order.status = ANY (v_pre_ship)) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'shipped_locked', 'status', v_order.status);
  END IF;
  IF v_order.tracking_number IS NOT NULL OR v_order.qr_token IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'label_generated');
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'empty_items');
  END IF;

  SELECT COALESCE(SUM((it->>'quantity')::int * (it->>'unit_price')::numeric), 0)
    INTO v_new_total
    FROM jsonb_array_elements(p_items) it;

  DELETE FROM public.order_items WHERE order_id = p_order_id;
  INSERT INTO public.order_items (order_id, product_name, quantity, unit_price, total_price)
  SELECT p_order_id,
         it->>'product_name',
         (it->>'quantity')::int,
         (it->>'unit_price')::numeric,
         (it->>'quantity')::int * (it->>'unit_price')::numeric
    FROM jsonb_array_elements(p_items) it;

  UPDATE public.orders
     SET total_amount = v_new_total,
         original_total_amount = COALESCE(original_total_amount, v_order.total_amount),
         updated_at = now()
   WHERE id = p_order_id;

  INSERT INTO public.order_amount_history (order_id, old_amount, new_amount, reason, changed_by)
  VALUES (p_order_id, v_order.total_amount, v_new_total, COALESCE(p_reason, 'content_changed'), auth.uid());

  RETURN jsonb_build_object('ok', true, 'old_total', v_order.total_amount, 'new_total', v_new_total);
END;
$$;
