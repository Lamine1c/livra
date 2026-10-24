-- 055 — T0C-1 · modify_order_content : le COD recalculé INCLUT les frais de livraison.
--
-- CONTEXTE (décision Claudy T0C) : `total_amount` = montant encaissé À LA PORTE, frais de
-- livraison INCLUS (c'est ce que le mobile écrit déjà à la création, orders/new.tsx:277, et ce
-- qu'Ecotrack attend comme `montant`). La 049 recalculait `total_amount = Σ(articles)` SEUL →
-- toute négociation produit via adjust-items EFFAÇAIT les frais du COD (le vendeur encaissait les
-- articles nus à la porte). On corrige : `total_amount = Σ(articles) + delivery_fee`.
--
-- ⚠️ La 049 est DÉJÀ APPLIQUÉE en prod → on ne la modifie pas ; cette 055 est un
-- `CREATE OR REPLACE FUNCTION` de MÊME signature. SEULE différence de comportement : l'ajout de
-- `delivery_fee` au total recalculé. Tout le reste (bornes, verrou, trace, original_total_amount)
-- est identique à la 049.
--
-- ⚠️ NON appliquée par cc (règle 4). Apply = Lamine via SQL Editor. PILE : 045→052→055 (053-054 = autre cc).

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
  -- [T0C-1] on lit AUSSI delivery_fee : il entre dans le COD recalculé.
  SELECT id, status, total_amount, delivery_fee, tracking_number, qr_token
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

  -- [T0C-1] COD = Σ(articles) + frais de livraison (frais INCLUS). delivery_fee inchangé par ailleurs.
  SELECT COALESCE(SUM((it->>'quantity')::int * (it->>'unit_price')::numeric), 0) + COALESCE(v_order.delivery_fee, 0)
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

-- ROLLBACK : réappliquer la version 049 (total_amount = Σ articles, sans delivery_fee).
