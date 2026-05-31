import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { verifyJWT } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const user = await verifyJWT(req);
    let resultData = null;

    const { data: franchise, error: fError } = await adminClient
      .from('franchises')
      .select('league_id')
      .eq('user_id', user.id)
      .single();
    if (fError) throw fError;
    
    if (req.method === 'GET') {
      if (!franchise.league_id) throw new Error("User not in a league");
      const { data, error } = await adminClient
        .from('matches')
        .select('*')
        .eq('league_id', franchise.league_id)
        .order('match_time', { ascending: true });
        
      if (error) throw error;
      resultData = data;
    }

    return new Response(JSON.stringify({ success: true, data: resultData || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const status = err.message === "unauthorized" ? 401 : 400;
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
