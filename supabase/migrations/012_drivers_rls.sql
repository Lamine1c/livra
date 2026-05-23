-- Migration: 012_drivers_rls
-- Activate Row Level Security on public.drivers.
--
-- Context:
--   - All WRITE operations (INSERT, UPDATE, DELETE) happen exclusively through
--     Next.js API routes that use the service_role key (createServiceClient).
--   - The mobile app (Expo, anon key) needs READ access to identify the driver
--     by device_id. It never needs to read sensitive columns (whatsapp, wilaya,
--     couleur_casque).
--   - Vendors have no direct access to this table.
--
-- BREAKING CHANGE (action required before applying):
--   mobile/app/(driver)/scan.tsx ~line 79 does a direct anon UPDATE on last_scan_at.
--   After this migration, that call will fail silently (no anon UPDATE policy).
--   Fix: move the update into /api/scan (already uses service_role, already
--   queries the driver row) before applying this migration.

-- 1. Enable RLS (default-deny: every access blocked unless a policy grants it)
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- 2. Service role: unrestricted access for all Next.js API routes
--    Covers: verify-otp (upsert), scan (select), refresh-token (select),
--    start-delivery (select prenom)
CREATE POLICY "drivers_service_role_all" ON public.drivers
  FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. Anon (mobile): read-only, verified drivers only.
--    App code further filters by device_id — RLS cannot enforce device_id
--    ownership without a Supabase auth session, but blocks all unverified rows.
CREATE POLICY "drivers_anon_select_verified" ON public.drivers
  FOR SELECT
  TO anon
  USING (whatsapp_verified = true);

-- 4. Column-level restriction: prevent anon from reading sensitive columns.
--    Mobile only needs: id, prenom, device_id (for WHERE filter), whatsapp_verified.
--    Excluded: whatsapp (phone PII), wilaya, couleur_casque, whatsapp_verified_at, created_at.
REVOKE SELECT ON public.drivers FROM anon;
GRANT  SELECT (id, prenom, device_id, whatsapp_verified, last_scan_at)
  ON public.drivers TO anon;

-- No anon INSERT, UPDATE, or DELETE policies — all write paths go through service_role only.
