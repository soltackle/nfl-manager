-- Create Coach Type
CREATE TYPE coach_type AS ENUM ('offensive', 'defensive');

-- Create Coaches Table
CREATE TABLE coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type coach_type NOT NULL,
  prediction_rating INTEGER NOT NULL DEFAULT 70,
  traits JSONB DEFAULT '[]',
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_coaches_franchise_id ON coaches(franchise_id);
CREATE INDEX idx_coaches_type ON coaches(type);

-- RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY coaches_read_all ON coaches FOR SELECT USING (true);

CREATE POLICY coaches_update_owner ON coaches FOR UPDATE USING (
  franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
);

CREATE POLICY coaches_insert_auth ON coaches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY coaches_update_auth ON coaches FOR UPDATE USING (auth.uid() IS NOT NULL);
