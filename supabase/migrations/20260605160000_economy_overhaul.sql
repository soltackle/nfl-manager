-- 1. Modify `players` table
ALTER TABLE players ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'free_agent';
ALTER TABLE players ADD COLUMN IF NOT EXISTS listed_price INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS target_user_id UUID;
ALTER TABLE players ADD COLUMN IF NOT EXISTS hidden_traits JSONB DEFAULT '[]'::jsonb;

-- 2. Modify `franchises` table
ALTER TABLE franchises ADD COLUMN IF NOT EXISTS budget INTEGER DEFAULT 100000000;

-- 3. Create `trade_offers` table
CREATE TABLE IF NOT EXISTS trade_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  sender_franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  receiver_franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  offered_player_ids JSONB DEFAULT '[]'::jsonb,
  offered_coins INTEGER DEFAULT 0,
  requested_player_ids JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create `league_chat` table
CREATE TABLE IF NOT EXISTS league_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE, -- null if system message
  message TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE trade_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_chat ENABLE ROW LEVEL SECURITY;

-- Policies for trade_offers
CREATE POLICY "Anyone in league can read trade offers"
  ON trade_offers FOR SELECT
  USING (
    league_id IN (
      SELECT league_id FROM franchises WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert trade offers from their franchise"
  ON trade_offers FOR INSERT
  WITH CHECK (
    sender_franchise_id IN (
      SELECT id FROM franchises WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update trade offers they are involved in"
  ON trade_offers FOR UPDATE
  USING (
    sender_franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid()) OR
    receiver_franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
  );

-- Policies for league_chat
CREATE POLICY "Anyone in league can read chat"
  ON league_chat FOR SELECT
  USING (
    league_id IN (
      SELECT league_id FROM franchises WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chat messages for their franchise"
  ON league_chat FOR INSERT
  WITH CHECK (
    franchise_id IN (
      SELECT id FROM franchises WHERE user_id = auth.uid()
    )
  );
