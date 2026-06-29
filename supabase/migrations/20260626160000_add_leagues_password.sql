-- Manual league system: private (password-protected) leagues created by normal users.
-- The leagues table had no `password` column, so create-league / join-league inserts
-- referencing `password` would have failed. Add it (nullable; null = public/no password).
-- NOTE: we intentionally do NOT revoke column SELECT — the lobby invite UI shows the
-- password to the league owner so they can share it; it is a low-stakes join code.
alter table public.leagues add column if not exists password text;
