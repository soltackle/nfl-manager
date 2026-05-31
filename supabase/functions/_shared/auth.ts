import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function verifyJWT(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("unauthorized");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("unauthorized");
  return user;
}
