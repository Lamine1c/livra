-- Migration: add expo_push_token column to profiles for vendor push notifications
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT NULL;

COMMENT ON COLUMN public.profiles.expo_push_token IS
  'Expo push token for vendor. Updated by mobile on each app launch. NULL if user has not granted notification permission or is using Expo Go (no push support since SDK 53).';
