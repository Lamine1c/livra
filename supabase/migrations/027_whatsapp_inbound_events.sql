-- 027_whatsapp_inbound_events.sql
-- Idempotence des webhooks WhatsApp entrants.
-- Meta livre les webhooks "at least once" et RE-TENTE si le 200 tarde (notre
-- handler fait DB + envois Graph avant de répondre). Sans déduplication, un
-- même « OUI » re-livré déclenche 2× MSG 2, 2× confirmation, etc.
-- On "claim" chaque message id Meta (wamid) exactement une fois : la contrainte
-- PRIMARY KEY garantit l'atomicité même sous deux invocations concurrentes.
create table if not exists public.whatsapp_inbound_events (
  wamid        text primary key,
  processed_at timestamptz not null default now()
);

-- Accès uniquement via le service role (webhook serveur). RLS activé sans policy
-- => aucun rôle client (anon/authenticated) ne peut lire/écrire ; le service
-- role bypasse RLS.
alter table public.whatsapp_inbound_events enable row level security;

-- Purge à planifier (les events de +7 jours ne servent plus à rien) :
--   delete from public.whatsapp_inbound_events where processed_at < now() - interval '7 days';
