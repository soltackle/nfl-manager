-- Move the 5 GitHub-Actions cron jobs into Supabase (pg_cron + plpgsql).
-- Faithful ports of scripts/{cleanup,training-complete,season-end,fa-market,match-engine}.ts
-- Removes the dependency on GitHub Actions + secrets. The .github/workflows/cron-*.yml files
-- were neutralized (workflow_dispatch only) to avoid double-execution.
-- SECURITY DEFINER so they run with full privileges (bypass RLS), like the service-role scripts.

create extension if not exists pg_cron;

-- 1) cleanup expired match drive logs (scripts/cleanup.ts) — daily 00:00 UTC
create or replace function public.cron_cleanup_logs()
returns void language plpgsql security definer set search_path = public, pg_temp as $fn$
begin
  delete from public.match_drive_logs where expires_at < now();
end;
$fn$;

-- 2) complete training sessions (scripts/training-complete.ts) — every 30 min
create or replace function public.cron_complete_training()
returns void language plpgsql security definer set search_path = public, pg_temp as $fn$
begin
  with inc as (
    select player_id, sum(2 + floor(random()*4)::int) as total_inc
    from public.training_sessions
    where completed_at < now()
    group by player_id
  )
  update public.players p
     set overall = least(99, p.overall + inc.total_inc)
    from inc
   where inc.player_id = p.id;

  delete from public.training_sessions where completed_at < now();
end;
$fn$;

-- 3) season end: rewards + reset (scripts/season-end.ts) — Sundays 21:00 UTC
create or replace function public.cron_season_end()
returns void language plpgsql security definer set search_path = public, pg_temp as $fn$
declare
  v_league record;
  v_member record;
  v_rank int;
  v_reward int;
  v_fr_ids uuid[];
begin
  for v_league in select id from public.leagues where status = 'active' loop
    v_rank := 0;
    for v_member in
      select user_id from public.league_members where league_id = v_league.id order by points desc
    loop
      v_reward := case v_rank when 0 then 500 when 1 then 250 else 50 end;
      update public.users
         set amfutcoin = coalesce(amfutcoin,0) + v_reward,
             manager_xp = coalesce(manager_xp,0) + 100
       where id = v_member.user_id;
      v_rank := v_rank + 1;
    end loop;

    select array_agg(id) into v_fr_ids from public.franchises where league_id = v_league.id;
    if v_fr_ids is not null and array_length(v_fr_ids,1) > 0 then
      update public.players set franchise_id = null where franchise_id = any(v_fr_ids);
      delete from public.depth_charts where franchise_id = any(v_fr_ids);
    end if;

    update public.leagues set status = 'waiting' where id = v_league.id;
    update public.league_members set points = 0, form_streak = 0 where league_id = v_league.id;
  end loop;
end;
$fn$;

-- 4) free-agent market refresh (scripts/fa-market.ts) — hourly
create or replace function public.cron_fa_market()
returns void language plpgsql security definer set search_path = public, pg_temp as $fn$
declare
  v_positions text[] := array['QB','RB','WR','TE','OL','DE','LB','CB','S'];
  v_trait_pool jsonb := '{
    "QB":["Pocket Presence","Scrambler","Cannon Arm","Game Manager","Clutch","Field General","Gunslinger"],
    "RB":["Power Back","Elusive","Receiving Back","Workhorse","Goal Line Back","Home Run Hitter"],
    "WR":["Deep Threat","Possession","Red Zone Target","Route Runner","YAC Machine","Jump Ball Spec."],
    "TE":["Blocking TE","Vertical Threat","Safety Blanket","Red Zone Target","YAC Machine"],
    "OL":["Pass Protector","Road Grader","Anchor","Puller","Ironman","Mauler"],
    "DL":["Edge Rusher","Run Stopper","Interior Penetrator","Bull Rusher","Finesse Rusher","Hit Power"],
    "DE":["Edge Rusher","Run Stopper","Interior Penetrator","Bull Rusher","Finesse Rusher","Hit Power"],
    "LB":["Coverage LB","Thumper","Sideline-to-Sideline","Blitz Specialist","Field General","Hit Power"],
    "CB":["Shutdown Corner","Ball Hawk","Press Coverage","Zone Specialist","Return Specialist","Acrobat"],
    "S":["Hard Hitter","Center Fielder","Box Safety","Ball Hawk","Defensive Captain","Hit Power"],
    "K":["Big Leg","Clutch","Accuracy","Kickoff Specialist"]
  }'::jsonb;
  i int;
  v_pos text;
  v_ovr int;
  v_base numeric;
  v_trait_count int;
  v_factor numeric;
  v_value int;
  v_pool jsonb;
  v_traits jsonb;
  v_remove_count int;
begin
  for i in 1..3 loop
    v_pos := v_positions[1 + floor(random()*array_length(v_positions,1))::int];
    v_ovr := 55 + floor(random()*30)::int;
    v_base := power((v_ovr-50), 2) * 200 + floor(random()*5000);
    if v_ovr >= 90 then v_trait_count := 3;
    elsif v_ovr >= 75 then v_trait_count := 2;
    else v_trait_count := case when random() < 0.5 then 1 else 2 end;
    end if;
    v_pool := coalesce(v_trait_pool -> v_pos, '["Clutch","Ironman","Team Player"]'::jsonb);
    select coalesce(jsonb_agg(x.value), '[]'::jsonb) into v_traits
      from (select value from jsonb_array_elements_text(v_pool) order by random() limit v_trait_count) x;
    v_factor := case v_trait_count when 3 then 1.2 when 2 then 1.1 when 1 then 1.0 else 0.9 end;
    v_value := floor(v_base * v_factor)::int;
    insert into public.players (name, position, overall, value, traits, franchise_id)
    values ('FA ' || v_pos || ' ' || floor(random()*1000)::int, v_pos::player_position, v_ovr, v_value, v_traits, null);
  end loop;

  select floor(count(*) * 0.2)::int into v_remove_count from public.players where franchise_id is null;
  if v_remove_count > 0 then
    delete from public.players
     where id in (select id from public.players where franchise_id is null order by random() limit v_remove_count);
  end if;
end;
$fn$;

-- 5) daily match engine — lightweight sim, faithful to scripts/match-engine.ts — daily 17:00 UTC
-- (The full 963-line tactical engine lives in the admin-simulate-match edge function for admin use.)
create or replace function public.cron_match_engine()
returns void language plpgsql security definer set search_path = public, pg_temp as $fn$
declare
  v_match record;
  v_home_tac jsonb;
  v_away_tac jsonb;
  v_home int;
  v_away int;
  v_logs jsonb;
  v_i int;
  v_is_home boolean;
  v_off_tac jsonb;
  v_pass_ratio numeric;
  v_is_pass boolean;
  v_success boolean;
begin
  for v_match in
    select m.id, m.league_id, m.home_franchise_id, m.away_franchise_id,
           hf.user_id as home_user, af.user_id as away_user
    from public.matches m
    join public.leagues l on l.id = m.league_id and l.status = 'active'
    left join public.franchises hf on hf.id = m.home_franchise_id
    left join public.franchises af on af.id = m.away_franchise_id
    where m.final_stats is null or m.final_stats = '{}'::jsonb
  loop
    select slider_ayarlari into v_home_tac from public.tactics where franchise_id = v_match.home_franchise_id;
    select slider_ayarlari into v_away_tac from public.tactics where franchise_id = v_match.away_franchise_id;

    v_home := 0; v_away := 0; v_logs := '[]'::jsonb;
    for v_i in 1..48 loop
      v_is_home := random() > 0.5;
      v_off_tac := case when v_is_home then v_home_tac else v_away_tac end;
      v_pass_ratio := coalesce((v_off_tac->>'pass_ratio')::numeric, 50);
      v_is_pass := (random()*100) < v_pass_ratio;
      v_success := (random()*100) < 30;
      if v_success then
        if v_is_home then v_home := v_home + 7; else v_away := v_away + 7; end if;
        v_logs := v_logs || jsonb_build_object('drive', v_i, 'team', case when v_is_home then 'home' else 'away' end, 'play', case when v_is_pass then 'Pass TD' else 'Run TD' end, 'result', 'TD');
      else
        v_logs := v_logs || jsonb_build_object('drive', v_i, 'team', case when v_is_home then 'home' else 'away' end, 'play', case when v_is_pass then 'Incomplete pass' else 'Run stopped' end, 'result', 'Punt');
      end if;
    end loop;

    update public.matches
       set home_score = v_home, away_score = v_away,
           final_stats = jsonb_build_object('played', true, 'home_score', v_home, 'away_score', v_away)
     where id = v_match.id;

    insert into public.match_drive_logs (match_id, plays, expires_at)
    values (v_match.id, v_logs, now() + interval '7 days');

    if v_home > v_away then
      update public.league_members set points = coalesce(points,0) + 2 where league_id = v_match.league_id and user_id = v_match.home_user;
    elsif v_away > v_home then
      update public.league_members set points = coalesce(points,0) + 2 where league_id = v_match.league_id and user_id = v_match.away_user;
    else
      update public.league_members set points = coalesce(points,0) + 1 where league_id = v_match.league_id and user_id in (v_match.home_user, v_match.away_user);
    end if;
  end loop;
end;
$fn$;

-- internal cron helpers — not API-callable
revoke execute on function
  public.cron_cleanup_logs(), public.cron_complete_training(),
  public.cron_season_end(), public.cron_fa_market(), public.cron_match_engine()
  from public, anon, authenticated;

-- schedule (UTC) — same cadences as the former GitHub Actions workflows
select cron.schedule('cleanup-logs',      '0 0 * * *',    $job$ select public.cron_cleanup_logs(); $job$);
select cron.schedule('complete-training', '*/30 * * * *', $job$ select public.cron_complete_training(); $job$);
select cron.schedule('match-engine',      '0 17 * * *',   $job$ select public.cron_match_engine(); $job$);
select cron.schedule('season-end',        '0 21 * * 0',   $job$ select public.cron_season_end(); $job$);
select cron.schedule('fa-market',         '0 * * * *',    $job$ select public.cron_fa_market(); $job$);
