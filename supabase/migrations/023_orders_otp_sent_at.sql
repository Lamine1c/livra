-- Versionne la colonne orders.otp_sent_at, présente en prod mais jamais versionnée
-- (elle aurait dû figurer dans 002_otp_columns.sql). Idempotent : no-op si déjà là.
-- Utilisée par send-otp (cooldown 60s) et confirm-order (tri du match OTP entrant).
alter table public.orders
  add column if not exists otp_sent_at timestamptz;
