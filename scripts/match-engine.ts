import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runMatchEngine() {
  console.log('Match engine started')
  
  // Find all leagues that are 'active'
  const { data: leagues } = await supabase.from('leagues').select('id').eq('status', 'active')
  if (!leagues || leagues.length === 0) return console.log('No active leagues')

  // Let's assume we play matches that haven't been played yet for the current week
  // But wait, there is no "current week" on league. Let's just find unplayed matches for active leagues.
  // We'll consider a match unplayed if final_stats is '{}'
  
  const { data: matches } = await supabase.from('matches')
    .select('*, home:home_franchise_id(*), away:away_franchise_id(*)')
    .in('league_id', leagues.map(l => l.id))
    
  if (!matches) return console.log('No matches found')
  
  const unplayedMatches = matches.filter(m => Object.keys(m.final_stats || {}).length === 0)
  
  for (const match of unplayedMatches) {
    console.log(`Simulating match ${match.id}`)
    // Fetch tactics
    const { data: homeTactic } = await supabase.from('tactics').select('*').eq('franchise_id', match.home_franchise_id).single()
    const { data: awayTactic } = await supabase.from('tactics').select('*').eq('franchise_id', match.away_franchise_id).single()
    
    let homeScore = 0
    let awayScore = 0
    let logs = []
    
    // Very simplified simulation: ~48 drives
    for (let i=0; i<48; i++) {
      const isHomeOffense = Math.random() > 0.5
      const offenseTactic = isHomeOffense ? homeTactic : awayTactic
      const defenseTactic = isHomeOffense ? awayTactic : homeTactic
      
      const passRatio = offenseTactic?.slider_ayarlari?.pass_ratio || 50
      const tempo = offenseTactic?.slider_ayarlari?.tempo || 50
      
      const isPass = Math.random() * 100 < passRatio
      const success = Math.random() * 100 < 30 // 30% chance to score per drive
      
      if (success) {
        if (isHomeOffense) homeScore += 7
        else awayScore += 7
        logs.push({ drive: i+1, team: isHomeOffense ? 'home' : 'away', play: isPass ? 'Pass TD' : 'Run TD', result: 'TD' })
      } else {
        logs.push({ drive: i+1, team: isHomeOffense ? 'home' : 'away', play: isPass ? 'Incomplete pass' : 'Run stopped', result: 'Punt' })
      }
    }
    
    // Write results
    await supabase.from('matches').update({
      home_score: homeScore,
      away_score: awayScore,
      final_stats: { played: true, home_score: homeScore, away_score: awayScore }
    }).eq('id', match.id)
    
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    
    await supabase.from('match_drive_logs').insert({
      match_id: match.id,
      plays: logs,
      expires_at: expiresAt.toISOString()
    })
    
    // Update points
    if (homeScore > awayScore) {
      await updatePoints(match.league_id, match.home.user_id, 2)
    } else if (awayScore > homeScore) {
      await updatePoints(match.league_id, match.away.user_id, 2)
    } else {
      await updatePoints(match.league_id, match.home.user_id, 1)
      await updatePoints(match.league_id, match.away.user_id, 1)
    }
  }
}

async function updatePoints(leagueId: string, userId: string, points: number) {
  const { data } = await supabase.from('league_members').select('points').eq('league_id', leagueId).eq('user_id', userId).single()
  if (data) {
    await supabase.from('league_members').update({ points: data.points + points }).eq('league_id', leagueId).eq('user_id', userId)
  }
}

runMatchEngine().catch(console.error)
