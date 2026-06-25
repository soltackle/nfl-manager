export interface User {
  id: string
  email: string
  username: string
  role?: string
  amfutcoin: number
  manager_xp: number
  last_coin_claim_at?: string
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
  budget: number
  morale: number
  league_id: string
  user_id: string
  active_sponsor_id?: string | null
  is_ready?: boolean
}

export interface Player {
  id: string
  name: string
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'DE' | 'DL' | 'LB' | 'CB' | 'S' | 'K'
  overall: number
  value: number
  franchise_id: string | null
  status: 'personal_pool' | 'free_agent' | 'roster' | 'listed_for_sale'
  listed_price?: number | null
  target_user_id?: string | null
  hidden_traits?: unknown
  traits?: unknown
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
  paketler: unknown[]
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
  final_stats: unknown
  league_id: string
  home_franchise_id: string
  away_franchise_id: string
}

export interface MatchDriveLog {
  id: string
  match_id: string
  plays: unknown[]
  expires_at: string
}

export interface TradeOffer {
  id: string
  league_id: string
  sender_franchise_id: string
  receiver_franchise_id: string
  offered_player_ids: string[]
  offered_coins: number
  requested_player_ids: string[]
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at: string
}

export interface LeagueChat {
  id: string
  league_id: string
  franchise_id: string | null
  message: string
  is_system: boolean
  created_at: string
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
