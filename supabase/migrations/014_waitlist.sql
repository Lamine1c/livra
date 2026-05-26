-- Waitlist pour la liste d'attente landing page LIVRA
CREATE TABLE IF NOT EXISTS public.waitlist (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email       text NOT NULL,
  source      text NOT NULL DEFAULT 'lp',
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_email_unique UNIQUE (email)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anon users can insert (signup from LP) but never select
CREATE POLICY "waitlist_anon_insert"
  ON public.waitlist
  FOR INSERT
  TO anon
  WITH CHECK (
    email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'  -- basic email format check
  );

-- Service role has full access
CREATE POLICY "waitlist_service_role_all"
  ON public.waitlist
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
