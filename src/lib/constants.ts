export const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S', 'K']

export const TACTIC_PACKAGES = [
  { id: 'normal', name: 'Normal' },
  { id: 'shotgun', name: 'Shotgun' },
  { id: 'pistol', name: 'Pistol' },
  { id: 'goal_line', name: 'Goal Line' }
]

export const REWARDS = {
  WIN: { points: 2, amfutcoin: 100 },
  TIE: { points: 1, amfutcoin: 50 },
  LOSS: { points: 0, amfutcoin: 20 }
}
