// playerUtils.ts
// Ortak oyuncu oluşturma ve hesaplama mantıkları

const TRAIT_POOL: Record<string, string[]> = {
  QB: ['Pocket Presence', 'Scrambler', 'Cannon Arm', 'Game Manager', 'Clutch', 'Field General', 'Gunslinger'],
  RB: ['Power Back', 'Elusive', 'Receiving Back', 'Workhorse', 'Goal Line Back', 'Home Run Hitter'],
  WR: ['Deep Threat', 'Possession', 'Red Zone Target', 'Route Runner', 'YAC Machine', 'Jump Ball Spec.'],
  TE: ['Blocking TE', 'Vertical Threat', 'Safety Blanket', 'Red Zone Target', 'YAC Machine'],
  OL: ['Pass Protector', 'Road Grader', 'Anchor', 'Puller', 'Ironman', 'Mauler'],
  DL: ['Edge Rusher', 'Run Stopper', 'Interior Penetrator', 'Bull Rusher', 'Finesse Rusher', 'Hit Power'],
  DE: ['Edge Rusher', 'Run Stopper', 'Interior Penetrator', 'Bull Rusher', 'Finesse Rusher', 'Hit Power'],
  LB: ['Coverage LB', 'Thumper', 'Sideline-to-Sideline', 'Blitz Specialist', 'Field General', 'Hit Power'],
  CB: ['Shutdown Corner', 'Ball Hawk', 'Press Coverage', 'Zone Specialist', 'Return Specialist', 'Acrobat'],
  S:  ['Hard Hitter', 'Center Fielder', 'Box Safety', 'Ball Hawk', 'Defensive Captain', 'Hit Power'],
  K:  ['Big Leg', 'Clutch', 'Accuracy', 'Kickoff Specialist'],
};

export function generateTraits(overall: number, position: string): string[] {
  let count = 0;
  if (overall >= 90) count = 3;
  else if (overall >= 75) count = 2;
  else count = Math.random() < 0.5 ? 1 : 2;

  const pool = TRAIT_POOL[position] || ['Clutch', 'Ironman', 'Team Player'];
  
  // Shuffle pool
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function calculatePlayerValue(baseValue: number, traitsCount: number): number {
  let factor = 0.9;
  if (traitsCount === 3) factor = 1.2;
  else if (traitsCount === 2) factor = 1.1;
  else if (traitsCount === 1) factor = 1.0;
  
  return Math.floor(baseValue * factor);
}

export function calculateBaseValue(overall: number): number {
  if (overall >= 95) return 28_000_000 + Math.floor(Math.random() * 7_000_000);
  if (overall >= 90) return 18_000_000 + Math.floor(Math.random() * 10_000_000);
  if (overall >= 86) return 12_000_000 + Math.floor(Math.random() * 5_000_000);
  if (overall >= 81) return 7_500_000 + Math.floor(Math.random() * 4_000_000);
  if (overall >= 76) return 4_500_000 + Math.floor(Math.random() * 2_500_000);
  if (overall >= 70) return 2_500_000 + Math.floor(Math.random() * 1_700_000);
  return 1_000_000 + Math.floor(Math.random() * 1_400_000);
}
