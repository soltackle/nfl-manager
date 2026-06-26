-- Required for Supabase Realtime filters/UPDATE payloads on franchises
ALTER TABLE franchises REPLICA IDENTITY FULL;
