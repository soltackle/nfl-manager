import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read env variables from .env if needed, but we can just use the config
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TRAIT_POOLS = {
  QB: ['Pocket Presence', 'Scrambler', 'Gunslinger', 'Game Manager', 'Clutch'],
  RB: ['Power Back', 'Elusive', 'Receiving Back', 'Workhorse'],
  WR: ['Deep Threat', 'Possession', 'YAC Machine', 'Red Zone Target'],
  TE: ['Red Zone Target', 'Run Blocker', 'Vertical Threat', 'Reliable Hands'],
  OL: ['Road Grader', 'Pass Protector', 'Ironman', 'Mauler'],
  DL: ['Edge Rusher', 'Run Stuffer', 'Power Rusher', 'Relentless'],
  LB: ['Hit Power', 'Coverage LB', 'Sideline-to-Sideline', 'Field General'],
  DB: ['Ball Hawk', 'Shutdown Corner', 'Hard Hitter', 'Coverage Specialist'],
  K: ['Clutch Kicker', 'Big Leg'],
  P: ['Coffin Corner', 'Boomer']
};

function getRandomTraits(position, count) {
  const pool = TRAIT_POOLS[position] || ['Team Player', 'High Motor'];
  // shuffle
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, pool.length));
}

async function seedTraits() {
  console.log("Fetching players...");
  // Fetch all players
  let allPlayers = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('players')
      .select('id, position, overall, traits')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error("Error fetching players:", error);
      return;
    }
    
    if (data.length === 0) break;
    allPlayers = [...allPlayers, ...data];
    page++;
  }
  
  console.log(`Found ${allPlayers.length} players. Updating traits...`);
  
  let updatedCount = 0;
  for (const player of allPlayers) {
    // Only update if traits are empty or missing
    if (!player.traits || player.traits.length === 0) {
      let traitCount = 1;
      if (player.overall >= 90) traitCount = 3;
      else if (player.overall >= 75) traitCount = 2;
      else if (player.overall >= 60) traitCount = 2; // Role players have 2 traits per PRD
      else traitCount = 1;
      
      const newTraits = getRandomTraits(player.position, traitCount);
      
      const { error } = await supabase
        .from('players')
        .update({ traits: newTraits })
        .eq('id', player.id);
        
      if (error) {
        console.error(`Error updating player ${player.id}:`, error);
      } else {
        updatedCount++;
        if (updatedCount % 100 === 0) console.log(`Updated ${updatedCount} players...`);
      }
    }
  }
  
  console.log(`Successfully assigned traits to ${updatedCount} players.`);
}

seedTraits();
