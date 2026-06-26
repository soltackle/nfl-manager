-- Migration for scout_missions

CREATE TABLE IF NOT EXISTS public.scout_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position text NOT NULL,
  status text NOT NULL DEFAULT 'searching', -- 'searching', 'ready', 'claimed'
  end_time timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_date date NOT NULL DEFAULT CURRENT_DATE,
  player_data jsonb
);

-- RLS
ALTER TABLE public.scout_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scout missions" 
  ON public.scout_missions FOR SELECT 
  USING (auth.uid() = user_id);

-- Edge functions will use service_role so they bypass RLS for inserts/updates.
