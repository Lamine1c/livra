-- Aligner la table deliveries avec la migration 006
-- État actuel : status DEFAULT 'in_progress', CHECK ('in_progress', 'completed', 'cancelled')
-- État cible  : status DEFAULT 'active',      CHECK ('active',      'completed', 'cancelled')
-- Raison : table créée manuellement dans Supabase Studio, pas via la migration.
--
-- ⚠️ À exécuter via Supabase Studio → SQL Editor (pas supabase db push).

-- Étape 1 : migrer les lignes existantes
UPDATE public.deliveries SET status = 'active' WHERE status = 'in_progress';

-- Étape 2 : supprimer l'ancien CHECK
ALTER TABLE public.deliveries DROP CONSTRAINT IF EXISTS deliveries_status_check;

-- Étape 3 : corriger le DEFAULT
ALTER TABLE public.deliveries ALTER COLUMN status SET DEFAULT 'active';

-- Étape 4 : recréer le CHECK avec les bonnes valeurs
ALTER TABLE public.deliveries
  ADD CONSTRAINT deliveries_status_check
  CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text]));
