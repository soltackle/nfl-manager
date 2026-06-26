-- Economy and Club Infrastructure (Faz 6)

CREATE TABLE IF NOT EXISTS stadiums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  turf_level INT DEFAULT 0, -- 0 to 3
  capacity_level INT DEFAULT 0, -- 0 to 3
  practice_facility_level INT DEFAULT 0, -- 0 to 3
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stadiums ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'stadiums' AND policyname = 'stadiums_read_all'
  ) THEN
    CREATE POLICY stadiums_read_all ON stadiums FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'stadiums' AND policyname = 'stadiums_update_owner'
  ) THEN
    CREATE POLICY stadiums_update_owner ON stadiums FOR UPDATE USING (
      franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- Trigger to create stadium when franchise is created
CREATE OR REPLACE FUNCTION create_stadium_for_franchise()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stadiums (franchise_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_franchise_created ON franchises;
CREATE TRIGGER on_franchise_created
  AFTER INSERT ON franchises
  FOR EACH ROW EXECUTE PROCEDURE create_stadium_for_franchise();
