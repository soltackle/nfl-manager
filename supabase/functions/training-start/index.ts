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
      const { player_id, training_type } = body;
      
      const { data: franchise, error: fError } = await adminClient
        .from('franchises')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (fError) throw fError;
      
      const { data, error } = await adminClient
        .from('training_sessions')
        .insert({ 
          franchise_id: franchise.id,
          player_id,
          training_type,
          status: 'in_progress',
          start_time: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      resultData = data;
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
