-- 043 — N32W.2 · push_tokens (multi-device)
--
-- POURQUOI : aujourd'hui le token Expo Push vit dans UNE colonne unique (`profiles.expo_push_token`,
-- `drivers.expo_push_token`). Un vendeur/livreur sur DEUX téléphones écrase son token à chaque
-- enregistrement → il ne reçoit ses pushs que sur le dernier device connecté. Cette table permet N
-- tokens par owner ; l'envoi (lib expo-push) itère sur TOUS les tokens de l'owner.
--
-- token = PRIMARY KEY (UNIQUE) : un device physique = un token = un owner. Si un même device se
-- réenregistre sous un autre compte (revente, changement de compte), l'upsert onConflict(token)
-- le réattribue proprement (owner_id/updated_at mis à jour) — pas de doublon.
--
-- ⚠️ NE PAS appliquer via un outil — Lamine l'exécute dans le SQL Editor. Tant que cette table
-- n'existe pas, la lib push retombe sur la colonne unique legacy (fallback) → zéro régression.

create table if not exists public.push_tokens (
  owner_type text        not null check (owner_type in ('profile', 'driver')),
  owner_id   uuid        not null,
  token      text        not null,
  updated_at timestamptz not null default now(),
  primary key (token)
);

-- Lookup principal : tous les tokens d'un owner à l'envoi.
create index if not exists idx_push_tokens_owner on public.push_tokens (owner_type, owner_id);

-- Accès uniquement via le service role (routes serveur). RLS activé SANS policy → aucun rôle
-- client (anon/authenticated) ne lit/écrit ; le service role bypasse RLS. Même doctrine que
-- whatsapp_inbound_events (027).
alter table public.push_tokens enable row level security;
