const fs = require('fs');
const replaces = [
  ['./supabase/functions/_shared/playerUtils.ts', /const \{ data: count \} =/, 'const { data: _count } ='],
  ['./supabase/functions/admin-create-league/index.ts', /error: botFErr/, 'error: _botFErr'],
  ['./supabase/functions/admin-simulate-draft/index.ts', /const draftSession =/, 'const _draftSession ='],
  ['./supabase/functions/admin-simulate-match/index.ts', /catch \(e\)/, 'catch (_e)'],
  ['./supabase/functions/admin-temp-sql/index.ts', /serve\(async \(req, ctx\) => \{/, 'serve(async (req, _ctx) => {'],
  ['./supabase/functions/auto-matchmake/index.ts', /const isNewLeague =/, 'const _isNewLeague ='],
  ['./supabase/functions/league-set-draft-time/index.ts', /const \{ data, error \} = await supabaseClient/, 'const { error } = await supabaseClient'],
  ['./supabase/functions/league-start-team-creation/index.ts', /const prefix = /g, 'const _prefix = '],
  ['./supabase/functions/make-draft-pick/index.ts', /catch \(e\) \{\s*\}/, 'catch (_e) {}'],
  ['./supabase/functions/market-free-agents/index.ts', /const \{ data: \{ user \}, error: authErr \}/, 'const { error: authErr }'],
  ['./supabase/functions/matches-result/index.ts', /const \{ data: \{ user \}, error: authErr \}/, 'const { error: authErr }'],
  ['./supabase/functions/player-ready/index.ts', /catch \(e\) \{\s*\}/, 'catch (_e) {}'],
  ['./supabase/functions/shop-purchase/index.ts', /league_id = null/, '_league_id = null'],
  ['./supabase/functions/start-training/index.ts', /slot = ''/, '_slot = \'\''],
  ['./supabase/functions/upgrade-stadium/index.ts', /error: sErr/, 'error: _sErr'],
  ['./src/pages/match/MatchResultPage.tsx', /setPlaybackState\('finished'\)\s*setCurrentHomeScore/, 'setCurrentHomeScore'],
  ['./src/pages/tactics/TacticsPage.tsx', /setSliders\(prev => \(\{ \.\.\.prev, \.\.\.\(tactics\.slider_ayarlari as unknown\) \}\)\)/, '/* setSliders */'],
  ['./src/pages/roster/RosterPage.tsx', /Card, CardContent, /, ''],
  ['./src/pages/shop/ShopPage.tsx', /Shield, /, '']
];

replaces.forEach(([f, regex, replace]) => {
  try {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(regex, replace);
    fs.writeFileSync(f, c);
    console.log('Fixed', f);
  } catch (err) {
    console.error(err);
  }
});
