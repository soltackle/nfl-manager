-- Extension for uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables to allow clean re-runs
DROP TABLE IF EXISTS training_sessions CASCADE;
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS sponsors CASCADE;
DROP TABLE IF EXISTS draft_picks CASCADE;
DROP TABLE IF EXISTS draft_sessions CASCADE;
DROP TABLE IF EXISTS match_drive_logs CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS tactics CASCADE;
DROP TABLE IF EXISTS depth_charts CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS franchises CASCADE;
DROP TABLE IF EXISTS league_members CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types if they exist to prevent errors during re-runs
DROP TYPE IF EXISTS league_status CASCADE;
DROP TYPE IF EXISTS player_position CASCADE;

-- Enum types
CREATE TYPE league_status AS ENUM ('waiting', 'draft', 'active', 'playoffs', 'completed');
CREATE TYPE player_position AS ENUM ('QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S', 'K');

-- users
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  amfutcoin INTEGER DEFAULT 0,
  manager_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- leagues
CREATE TABLE leagues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  match_time_utc TIME NOT NULL,
  status league_status DEFAULT 'waiting',
  is_public BOOLEAN DEFAULT true,
  owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- league_members
CREATE TABLE league_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  form_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- franchises
CREATE TABLE franchises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL,
  city TEXT NOT NULL,
  club_fund INTEGER DEFAULT 100000,
  morale INTEGER DEFAULT 100,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- players
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position player_position NOT NULL,
  overall INTEGER NOT NULL,
  value INTEGER NOT NULL,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- depth_charts
CREATE TABLE depth_charts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit TEXT NOT NULL,
  position player_position NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- tactics
CREATE TABLE tactics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE UNIQUE,
  paketler JSONB DEFAULT '[]',
  slider_ayarlari JSONB DEFAULT '{"pass_ratio": 50, "aggression": 50, "tempo": 50, "defense_line": 50}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- matches
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week INTEGER NOT NULL,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  final_stats JSONB DEFAULT '{}',
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  home_franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  away_franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- match_drive_logs
CREATE TABLE match_drive_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  plays JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- draft_sessions
CREATE TABLE draft_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE UNIQUE,
  current_round INTEGER DEFAULT 1,
  current_pick_franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- draft_picks
CREATE TABLE draft_picks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round INTEGER NOT NULL,
  pick_number INTEGER NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  session_id UUID REFERENCES draft_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- sponsors
CREATE TABLE sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  board_position TEXT NOT NULL,
  bonus INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- achievements
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  is_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- admin_logs
CREATE TABLE admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- training_sessions
CREATE TABLE training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_players_franchise_id ON players(franchise_id);
CREATE INDEX idx_depth_charts_franchise_id ON depth_charts(franchise_id);
CREATE INDEX idx_matches_league_week ON matches(league_id, week);
CREATE INDEX idx_match_drive_logs_match_expires ON match_drive_logs(match_id, expires_at);
CREATE INDEX idx_draft_picks_session ON draft_picks(session_id);
CREATE INDEX idx_league_members_league_user ON league_members(league_id, user_id);

-- ROW LEVEL SECURITY

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE depth_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactics ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_drive_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self_read ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_self_update ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY franchises_read_all ON franchises FOR SELECT USING (true);
CREATE POLICY franchises_update_self ON franchises FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY franchises_insert_self ON franchises FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY players_read_all ON players FOR SELECT USING (true);
CREATE POLICY players_update_owner ON players FOR UPDATE USING (
  franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
);
CREATE POLICY depth_charts_read_all ON depth_charts FOR SELECT USING (true);
CREATE POLICY depth_charts_all_owner ON depth_charts FOR ALL USING (
  franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
);
CREATE POLICY tactics_read_all ON tactics FOR SELECT USING (true);
CREATE POLICY tactics_all_owner ON tactics FOR ALL USING (
  franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
);

CREATE POLICY matches_read_all ON matches FOR SELECT USING (true);
CREATE POLICY match_drive_logs_read_all ON match_drive_logs FOR SELECT USING (true);

CREATE POLICY leagues_read_all ON leagues FOR SELECT USING (true);
CREATE POLICY league_members_read_all ON league_members FOR SELECT USING (true);
CREATE POLICY leagues_insert_auth ON leagues FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY league_members_insert_auth ON league_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY draft_sessions_read_all ON draft_sessions FOR SELECT USING (true);
CREATE POLICY draft_picks_read_all ON draft_picks FOR SELECT USING (true);

-- RPC
CREATE OR REPLACE FUNCTION buy_free_agent(
  p_franchise_id UUID,
  p_player_id    UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_player        players%ROWTYPE;
  v_franchise     franchises%ROWTYPE;
  v_cost          INTEGER;
BEGIN
  SELECT * INTO v_player FROM players
  WHERE id = p_player_id AND franchise_id IS NULL
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'player_not_available');
  END IF;

  SELECT * INTO v_franchise FROM franchises WHERE id = p_franchise_id FOR UPDATE;
  v_cost := v_player.value;

  IF v_franchise.club_fund < v_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_funds');
  END IF;

  UPDATE franchises SET club_fund = club_fund - v_cost WHERE id = p_franchise_id;
  UPDATE players     SET franchise_id = p_franchise_id   WHERE id = p_player_id;

  RETURN jsonb_build_object('success', true, 'cost', v_cost);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION generate_fixtures(p_league_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_teams UUID[];
  n       INT;
  i       INT; 
  j       INT; 
  week    INT := 1;
  home    UUID;
  away    UUID;
  half_n  INT;
BEGIN
  SELECT ARRAY(SELECT id FROM franchises WHERE league_id = p_league_id ORDER BY created_at)
  INTO v_teams;
  
  n := array_length(v_teams, 1);
  
  IF n < 2 THEN
    RETURN;
  END IF;

  IF n % 2 <> 0 THEN
    RETURN;
  END IF;

  half_n := n / 2;

  FOR week IN 1..(n - 1) LOOP
    FOR i IN 1..half_n LOOP
      home := v_teams[i];
      away := v_teams[n - i + 1];
      
      IF week % 2 = 0 THEN
        INSERT INTO matches(league_id, week, home_franchise_id, away_franchise_id) VALUES (p_league_id, week, away, home);
      ELSE
        INSERT INTO matches(league_id, week, home_franchise_id, away_franchise_id) VALUES (p_league_id, week, home, away);
      END IF;
    END LOOP;
    
    v_teams := v_teams[1:1] || v_teams[n:n] || v_teams[2:n-1];
  END LOOP;
END;
$$;
