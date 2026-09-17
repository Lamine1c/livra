-- 042 — N31W.3 · Purge des marqueurs de dédup wamid (whatsapp_inbound_events)
--
-- POURQUOI : la table `whatsapp_inbound_events` (027) ne sert qu'à dédupliquer les webhooks WhatsApp
-- entrants (1 wamid = 1 ligne, PK). Les vieux marqueurs ne servent plus à rien (Meta ne re-livre pas un
-- message ancien). Le DELETE de purge était laissé EN COMMENTAIRE dans 027 (`:18-19`). On l'active ici,
-- borné à **90 jours** (cohérent avec la rétention des leads, cf. purge-leads ; techniquement 7 j
-- suffiraient — cf. commentaire 027 — mais 90 j reste anodin et aligné sur la doctrine de rétention).
-- Colonne de rétention = `processed_at` (existante depuis 027, = quand le wamid a été « claimé »).
--
-- ⚠️ NE PAS appliquer via un outil — Lamine l'exécute dans le SQL Editor. Le cron
-- `/api/cron/purge-inbound-events` tourne À VIDE sans erreur tant que cette fonction n'existe pas.

CREATE OR REPLACE FUNCTION public.purge_expired_inbound_events(p_dry boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff timestamptz := now() - interval '90 days';
  v_count  bigint;
BEGIN
  SELECT count(*) INTO v_count
    FROM public.whatsapp_inbound_events
   WHERE processed_at < v_cutoff;

  IF NOT p_dry THEN
    DELETE FROM public.whatsapp_inbound_events
     WHERE processed_at < v_cutoff;
  END IF;

  RETURN jsonb_build_object('deleted', v_count, 'dry', p_dry, 'cutoff', v_cutoff);
END;
$$;
