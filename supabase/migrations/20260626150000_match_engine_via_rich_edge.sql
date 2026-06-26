-- Daily auto-match simulation now uses the RICH engine so NORMAL users (not just admin)
-- get the full play-by-play experience.
--
-- Before: pg_cron ran the lightweight plpgsql cron_match_engine (logs were {drive,team,play,result}
--         with no field positions) -> the match-watch screen could not animate them.
-- After:  pg_cron fires the cron-daily-matches edge function via pg_net, which calls
--         admin-simulate-match (the 963-line tactical engine) per active league / next week.
--         That produces rich logs {time,text,possession,startYard,endYard,playType,event}
--         (100+ plays) -> the upgraded MatchResultPage animates the whole match.
--
-- Verified: pg_net -> cron-daily-matches (anon JWT passes the gateway) -> admin-simulate-match
-- (internal X-Internal-Secret bypass) produced a 101-play rich match log. No redeploy needed.
-- The Bearer token below is the PUBLIC anon key (already shipped in the client bundle).

create extension if not exists pg_net;

select cron.schedule('match-engine', '0 17 * * *', $job$
  select net.http_post(
    url := 'https://rohvwsfivpnnmagzexam.supabase.co/functions/v1/cron-daily-matches',
    headers := '{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvaHZ3c2ZpdnBubm1hZ3pleGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQ1MDcsImV4cCI6MjA5NzkwMDUwN30.aTyzmzD-jryb4cSHRSDufHtPCr_jerQwxH3lUF-CLGs","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 60000);
$job$);

-- (The old lightweight public.cron_match_engine() function is left in place, unused, as a fallback.)
