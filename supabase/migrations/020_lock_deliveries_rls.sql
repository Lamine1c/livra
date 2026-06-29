-- Migration: 020_lock_deliveries_rls
-- ─────────────────────────────────────────────────────────────────────────────
-- TROU CRITIQUE détecté à l'audit sécurité 25 juin 2026 :
--   La migration 006 avait ouvert SELECT en anon avec `USING (true)` sur
--   `deliveries` et `delivery_positions`. Avec le anon key (extractable du
--   bundle web/mobile en 30 sec), N'IMPORTE QUI pouvait :
--     - lister TOUTES les livraisons LIVRA (tous vendeurs confondus)
--     - récupérer TOUTES les positions GPS de TOUS les livreurs
--     - corréler order_id → coordonnées → reconstruire domiciles clients
--   Violation RGPD-like + fuite massive de données business.
--
-- POURQUOI C'EST SAFE DE FIX :
--   Vérification du code (audit 25 juin) : ces tables ne sont PAS lues en
--   anon par le client. Tous les accès passent par des endpoints API qui
--   utilisent createServiceClient (bypass RLS naturel) :
--     - /api/track/status              → page tracking acheteur (poll 5s)
--     - /api/driver/check-buyer-location → écran course livreur (poll 5s)
--     - /api/driver/position           → upload GPS livreur
--     - /api/driver/start-delivery     → création delivery
--     - /api/driver/complete-delivery  → fin de course
--     - /api/driver/cancel-delivery    → annulation
--   moto-perso-tracker.tsx commente explicitement (ligne 90) :
--     "Poll every 5s — Realtime is blocked by RLS for anon buyer client"
--   course.tsx commente (ligne 91) :
--     "Realtime blocked by RLS for anon driver client"
--   → les `USING (true)` ne servent RIEN. Aucune feature ne casse.
--
-- APRÈS CE FIX :
--   - service_role : full access (inchangé, c'est par lui que tout passe)
--   - vendeur authentifié : SELECT sur SES propres livraisons (via jointure
--     orders.user_id), au cas où une future UI mobile vendeur aurait besoin
--     d'un Realtime channel sur ses propres deliveries. V1 n'en a pas besoin
--     mais on ouvre proprement plutôt que d'avoir à re-migrer plus tard.
--   - anon : ZÉRO accès direct. La page tracking publique continue via
--     /api/track/status (service_role) avec buyer_token HMAC vérifié.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. DROP les policies "Public can read ..." (USING true)
DROP POLICY IF EXISTS "Public can read deliveries"         ON public.deliveries;
DROP POLICY IF EXISTS "Public can read delivery_positions" ON public.delivery_positions;

-- ── 2. service_role : full access explicite (sécurité défensive)
--    Note : service_role bypass RLS par défaut côté Supabase, mais ajouter
--    une policy explicite documente l'intention et survit à un éventuel
--    changement de comportement par défaut.

DROP POLICY IF EXISTS "deliveries_service_role_all"         ON public.deliveries;
DROP POLICY IF EXISTS "delivery_positions_service_role_all" ON public.delivery_positions;

CREATE POLICY "deliveries_service_role_all"
  ON public.deliveries FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "delivery_positions_service_role_all"
  ON public.delivery_positions FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── 3. Vendeur authentifié : SELECT sur SES propres livraisons
--    (via jointure deliveries.order_id → orders.user_id)
--    → permet à terme un Realtime channel vendeur sur ses livraisons,
--      sans exposer celles des autres vendeurs.

CREATE POLICY "deliveries_vendor_select_own"
  ON public.deliveries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = deliveries.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "delivery_positions_vendor_select_own"
  ON public.delivery_positions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.deliveries d
      JOIN public.orders o ON o.id = d.order_id
      WHERE d.id = delivery_positions.delivery_id
        AND o.user_id = auth.uid()
    )
  );

-- ── 4. Vérification post-migration
--    Lance ces SELECT après application (depuis le SQL Editor de Supabase
--    avec le rôle authenticated d'un vendeur de test) :
--
--    -- Doit retourner UNIQUEMENT les deliveries du vendeur connecté :
--    SELECT id, order_id FROM public.deliveries;
--
--    -- En anon (depuis Postman ou curl avec le anon key),
--    -- doit retourner 0 lignes :
--    SELECT id FROM public.deliveries;
--    SELECT id FROM public.delivery_positions;
