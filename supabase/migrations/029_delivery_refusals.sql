-- 029_delivery_refusals.sql
-- Journalise deux événements distincts du livreur :
--   'refus'      → le livreur décline sur l'écran Course, AVANT start-delivery
--                  (aucune delivery créée → delivery_id NULL).
--   'annulation' → le livreur annule une livraison EN COURS, après start-delivery
--                  (delivery existante → delivery_id rempli).
-- Append-only : plusieurs refus possibles pour une même commande (re-scan par un
-- autre livreur) — on n'écrase jamais, on empile (audit + futur dashboard fiabilité).
-- `wilaya` est DÉNORMALISÉE volontairement (copie de clients.wilaya au moment de
-- l'écriture) : c'est de la data d'analyse → permet GROUP BY reason, wilaya sans
-- jointure orders→clients à chaque requête analytique.
-- ⚠️ À exécuter via Supabase Studio → SQL Editor (pas supabase db push).

create table if not exists public.delivery_refusals (
  id          uuid        primary key default gen_random_uuid(),
  order_id    uuid        not null references public.orders(id)     on delete cascade,
  delivery_id uuid                 references public.deliveries(id) on delete set null,
  driver_id   uuid,
  kind        text        not null check (kind in ('refus', 'annulation')),
  reason      text        not null,
  wilaya      text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_delivery_refusals_order_id on public.delivery_refusals(order_id);
create index if not exists idx_delivery_refusals_reason   on public.delivery_refusals(reason);
create index if not exists idx_delivery_refusals_wilaya   on public.delivery_refusals(wilaya);

-- RLS : les écritures passent uniquement par les endpoints driver (service role,
-- bypass RLS). Le vendeur peut lire les refus/annulations de SES commandes
-- (fondation du dashboard fiabilité). Aucune écriture ouverte.
alter table public.delivery_refusals enable row level security;

drop policy if exists "Vendor reads own delivery_refusals" on public.delivery_refusals;
create policy "Vendor reads own delivery_refusals"
  on public.delivery_refusals for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = public.delivery_refusals.order_id
        and o.user_id = auth.uid()
    )
  );
