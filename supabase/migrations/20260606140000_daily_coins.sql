-- Add last_coin_claim_at column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_coin_claim_at TIMESTAMP WITH TIME ZONE;

-- Give 500 amfutcoin to all existing users
UPDATE users SET amfutcoin = amfutcoin + 500;
