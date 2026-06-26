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
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (fError) throw fError;
    
    if (req.method === 'GET') {
      const { data, error } = await adminClient
        .from('depth_charts')
        .select('*')
        .eq('franchise_id', franchise.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      resultData = data;
    } else if (req.method === 'PUT') {
      const body = await req.json();
      const { data, error } = await adminClient
        .from('depth_charts')
        .upsert({ franchise_id: franchise.id, ...body })
        .select()
        .single();
        
      if (error) throw error;
      resultData = data;
    }

    return new Response(JSON.stringify({ success: true, data: resultData || {} }), {
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
