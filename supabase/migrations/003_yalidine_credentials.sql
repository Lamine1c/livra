alter table public.profiles
  add column if not exists yalidine_api_id    text,
  add column if not exists yalidine_api_token text;
