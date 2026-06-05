-- Enable Realtime for franchises and leagues
-- First, make sure the publication exists (it is created by default by Supabase)
-- Then add the tables to the publication.

BEGIN;
  -- Remove them first to avoid errors if they are already there
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.franchises;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.leagues;

  -- Add them back
  ALTER PUBLICATION supabase_realtime ADD TABLE public.franchises;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leagues;
COMMIT;
