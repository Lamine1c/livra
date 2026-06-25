-- Migration: 021_lock_drivers_anon
-- ──────────────────────────────────────────────────────────────────
-- Audit sécurité 25 juin 2026 — TROU CRITIQUE #2
--
-- La policy drivers_anon_select_verified (migration 012) permettait
-- l'énumération de TOUS les device_id livreurs via anon key. Combiné
-- avec /api/driver/refresh-token qui ne vérifiait que device_id, ça
-- permettait la prise de contrôle de TOUS les comptes livreur LIVRA :
-- marquer livré sans livrer, faux GPS, vol de colis.
--
-- Fix coordonné avec :
--   - /api/driver/refresh-token durci (Bearer token expiré + device_id)
--   - /api/driver/me créé (remplace les 3 SELECT anon mobile)
--   - 3 callers mobile migrés sur fetch /api/driver/me
--
-- Application : ne PAS appliquer cette migration avant que la branche
-- code (feature/sec-fix-2-drivers-rls) soit testée et mergée en main.
-- Sinon le mobile actuel casse instantanément.
-- ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "drivers_anon_select_verified" ON public.drivers;

-- GRANT column-level pour anon devient inutile, on révoque par propreté.
REVOKE SELECT (id, prenom, device_id, whatsapp_verified, last_scan_at)
  ON public.drivers FROM anon;

-- drivers_service_role_all existe déjà (migration 012), inchangé.
-- Aucune policy authenticated : les vendeurs n'accèdent jamais à drivers.

-- Vérification post-application (à lancer manuellement après) :
-- SELECT polname FROM pg_policy
-- WHERE polrelid = 'public.drivers'::regclass;
-- → Doit retourner UNIQUEMENT : drivers_service_role_all
