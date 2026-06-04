CREATE TABLE IF NOT EXISTS user_quests (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    login_claimed BOOLEAN DEFAULT FALSE,
    friendly_played INTEGER DEFAULT 0,
    friendly_claimed BOOLEAN DEFAULT FALSE,
    shop_bought INTEGER DEFAULT 0,
    shop_claimed BOOLEAN DEFAULT FALSE
);

-- RLS
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own quests" ON user_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quests" ON user_quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quests" ON user_quests FOR UPDATE USING (auth.uid() = user_id);
