-- Tokens transporteurs par vendeur (famille Ecotrack : DHD, Anderson, … extensible).
-- Table légère indexée par slug plutôt que des colonnes dédiées par transporteur.
create table if not exists public.carrier_tokens (
  user_id      uuid not null references auth.users(id) on delete cascade,
  carrier_slug text not null,
  token        text not null,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null,
  primary key (user_id, carrier_slug)
);

alter table public.carrier_tokens enable row level security;

-- Chaque vendeur ne gère que ses propres tokens (le service role bypass la RLS pour le cron).
create policy "Users manage own carrier tokens"
  on public.carrier_tokens for all
  using (auth.uid() = user_id);
