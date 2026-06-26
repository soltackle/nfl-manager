import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { verifyJWT } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const user = await verifyJWT(req);
    const url = new URL(req.url);
    const matchId = url.searchParams.get('id');
    let resultData = null;

    if (req.method === 'GET') {
      if (!matchId) throw new Error("Match ID required");
      const { data, error } = await adminClient
        .from('match_results')
        .select('*')
        .eq('match_id', matchId)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
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
