export interface User {
  id: string
  email: string
  username: string
  amfutcoin: number
  manager_xp: number
}

export interface League {
  id: string
  name: string
  match_time_utc: string
  status: 'waiting' | 'draft' | 'active' | 'playoffs' | 'completed'
  is_public: boolean
  owner_user_id: string
}

export interface LeagueMember {
  id: string
  league_id: string
  user_id: string
  points: number
  form_streak: number
}

export interface Franchise {
  id: string
  team_name: string
  city: string
  club_fund: number
  morale: number
  league_id: string
  user_id: string
}

export interface Player {
  id: string
  name: string
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'DE' | 'LB' | 'CB' | 'S' | 'K'
  overall: number
  value: number
  franchise_id: string | null
}

export interface DepthChart {
  id: string
  unit: string
  position: string
  player_id: string
  franchise_id: string
}

export interface Tactics {
  id: string
  franchise_id: string
  paketler: any[]
  slider_ayarlari: {
    pass_ratio: number
    aggression: number
    tempo: number
    defense_line: number
  }
}

export interface Match {
  id: string
  week: number
  home_score: number
  away_score: number
  final_stats: any
  league_id: string
  home_franchise_id: string
  away_franchise_id: string
}

export interface MatchDriveLog {
  id: string
  match_id: string
  plays: any[]
  expires_at: string
}

export interface DraftSession {
  id: string
  league_id: string
  current_round: number
  current_pick_franchise_id: string | null
}

export interface DraftPick {
  id: string
  round: number
  pick_number: number
  player_id: string
  franchise_id: string
  session_id: string
}

export interface Achievement {
  id: string
  user_id: string
  achievement_type: string
  is_claimed: boolean
}

export interface TrainingSession {
  id: string
  franchise_id: string
  player_id: string
  completed_at: string
}
