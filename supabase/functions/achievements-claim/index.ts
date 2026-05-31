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
      const { achievement_id } = body;
      
      const { data: uAch, error: uError } = await adminClient
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .eq('achievement_id', achievement_id)
        .single();
      if (uError) throw uError;
      
      if (uAch.claimed) throw new Error("Achievement already claimed");
      if (!uAch.completed) throw new Error("Achievement not completed yet");
      
      const { data, error } = await adminClient
        .from('user_achievements')
        .update({ claimed: true })
        .eq('id', uAch.id)
        .select()
        .single();
        
      if (error) throw error;
      resultData = data;
      // Note: Reward grant logic would typically be placed here or handled by a DB trigger
    }

    return new Response(JSON.stringify({ success: true, data: resultData }), {
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
