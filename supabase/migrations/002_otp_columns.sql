-- Add OTP verification fields to orders
alter table public.orders
  add column if not exists otp_code       text,
  add column if not exists otp_expires_at timestamptz,
  add column if not exists otp_verified_at timestamptz;
