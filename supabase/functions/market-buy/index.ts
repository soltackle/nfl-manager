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
    
    if (req.method === 'POST') {
      const body = await req.json();
      const { player_id } = body;
      
      const { data: franchise, error: fError } = await adminClient
        .from('franchises')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (fError) throw fError;
      
      const { data, error } = await adminClient.rpc('buy_free_agent', { 
        p_franchise_id: franchise.id, 
        p_player_id: player_id 
      });
      
      if (error) throw error;
      resultData = data;
    }

    return new Response(JSON.stringify({ success: true, data: resultData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const status = (err instanceof Error ? err.message : String(err)) === "unauthorized" ? 401 : 400;
    return new Response(JSON.stringify({ error: (err instanceof Error ? err.message : String(err)) }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
