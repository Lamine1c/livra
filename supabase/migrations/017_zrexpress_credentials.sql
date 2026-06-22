-- ZR Express (Procolis) credentials par vendeur — miroir de yalidine_api_id / yalidine_api_token.
-- Le vendeur récupère token + key dans son portail ZR Express → Paramètres → Infos perso.
alter table public.profiles
  add column if not exists zr_token text,
  add column if not exists zr_key   text;
