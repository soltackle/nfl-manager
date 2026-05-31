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
    
    if (req.method === 'PUT') {
      const body = await req.json();
      const { trade_id, status } = body;
      
      const { data: franchise, error: fError } = await adminClient
        .from('franchises')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (fError) throw fError;
      
      const { data: trade, error: tError } = await adminClient
        .from('trades')
        .select('*')
        .eq('id', trade_id)
        .single();
      if (tError) throw tError;
      
      if (trade.receiving_franchise_id !== franchise.id) {
        throw new Error("Trade offer is not for your franchise");
      }
      
      const { data, error } = await adminClient
        .from('trades')
        .update({ status })
        .eq('id', trade_id)
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
