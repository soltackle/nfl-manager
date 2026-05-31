-- Economy and Club Infrastructure (Faz 6)

CREATE TABLE stadiums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  turf_level INT DEFAULT 0, -- 0 to 3
  capacity_level INT DEFAULT 0, -- 0 to 3
  practice_facility_level INT DEFAULT 0, -- 0 to 3
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  slot_type TEXT NOT NULL, -- 'jersey_front', 'end_zone', 'scoreboard', 'naming_rights'
  amount_per_match INT NOT NULL,
  matches_remaining INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stadiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY stadiums_read_all ON stadiums FOR SELECT USING (true);
CREATE POLICY stadiums_update_owner ON stadiums FOR UPDATE USING (
  franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
);

CREATE POLICY sponsors_read_all ON sponsors FOR SELECT USING (true);
CREATE POLICY sponsors_update_owner ON sponsors FOR UPDATE USING (
  franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
);

-- Trigger to create stadium when franchise is created
CREATE OR REPLACE FUNCTION create_stadium_for_franchise()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stadiums (franchise_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_franchise_created
  AFTER INSERT ON franchises
  FOR EACH ROW EXECUTE PROCEDURE create_stadium_for_franchise();
