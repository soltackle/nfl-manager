import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { useFranchiseStore } from '@/store/franchiseStore'

export interface StandingRow {
  franchise_id: string
  team_name: string
  wins: number
  losses: number
  ties: number
  points_for: number
  points_against: number
  point_diff: number
  streak: string
  isUser: boolean
}

export function useStandings() {
  const { franchise } = useFranchiseStore()

  const fetcher = async (): Promise<StandingRow[]> => {
    if (!franchise) return []

    // Fetch all franchises in this league
    const { data: franchises } = await supabase
      .from('franchises')
      .select('id, team_name')
      .eq('league_id', franchise.league_id)

    if (!franchises) return []

    // Fetch all played matches in this league
    const { data: matches } = await supabase
      .from('matches')
      .select('home_franchise_id, away_franchise_id, home_score, away_score, final_stats, week')
      .eq('league_id', franchise.league_id)
      .order('week', { ascending: true })

    if (!matches) return []

    const playedMatches = matches.filter(m => m.final_stats?.played)

    // Build standings
    const map: Record<string, StandingRow> = {}
    for (const f of franchises) {
      map[f.id] = {
        franchise_id: f.id,
        team_name: f.team_name,
        wins: 0,
        losses: 0,
        ties: 0,
        points_for: 0,
        points_against: 0,
        point_diff: 0,
        streak: '-',
        isUser: f.id === franchise.id
      }
    }

    // Track last 5 results per team for streak
    const recentResults: Record<string, string[]> = {}
    for (const f of franchises) {
      recentResults[f.id] = []
    }

    for (const m of playedMatches) {
      const home = map[m.home_franchise_id]
      const away = map[m.away_franchise_id]
      if (!home || !away) continue

      home.points_for += m.home_score || 0
      home.points_against += m.away_score || 0
      away.points_for += m.away_score || 0
      away.points_against += m.home_score || 0

      if (m.home_score > m.away_score) {
        home.wins++
        away.losses++
        recentResults[m.home_franchise_id].push('W')
        recentResults[m.away_franchise_id].push('L')
      } else if (m.home_score < m.away_score) {
        home.losses++
        away.wins++
        recentResults[m.home_franchise_id].push('L')
        recentResults[m.away_franchise_id].push('W')
      } else {
        home.ties++
        away.ties++
        recentResults[m.home_franchise_id].push('T')
        recentResults[m.away_franchise_id].push('T')
      }
    }

    // Calculate streaks and point diff
    for (const f of franchises) {
      const row = map[f.id]
      row.point_diff = row.points_for - row.points_against

      const recent = recentResults[f.id].slice(-5)
      if (recent.length === 0) {
        row.streak = '-'
      } else {
        // Count consecutive same results from end
        let count = 1
        const last = recent[recent.length - 1]
        for (let i = recent.length - 2; i >= 0; i--) {
          if (recent[i] === last) count++
          else break
        }
        row.streak = `${count}${last}`
      }
    }

    // Sort: wins desc, then point_diff desc, then points_for desc
    const rows = Object.values(map)
    rows.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.point_diff !== a.point_diff) return b.point_diff - a.point_diff
      return b.points_for - a.points_for
    })

    return rows
  }

  const { data, error, isLoading, mutate } = useSWR<StandingRow[]>(
    franchise ? `standings-${franchise.league_id}` : null,
    fetcher
  )

  return { standings: data ?? [], error, isLoading, mutate }
}
