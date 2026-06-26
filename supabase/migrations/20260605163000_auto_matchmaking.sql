-- 1. Wipe out existing leagues (this will cascade and delete franchises, players, matches, etc. if ON DELETE CASCADE is set. If not, we should delete them explicitly)
DELETE FROM players;
DELETE FROM trade_offers;
DELETE FROM league_chat;
DELETE FROM matches;
DELETE FROM franchises;
DELETE FROM leagues;

-- 2. Add matchmaking_start_time to leagues
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS matchmaking_start_time TIMESTAMPTZ;
