
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
serve(async (req) => {
  const { filePath } = await req.json();
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await supabase.storage.from("uploads").createSignedUrl(filePath, 86400);
  if(error){ return new Response(JSON.stringify({ error: error.message }),{status:400, headers:{ "Content-Type":"application/json"}}); }
  return new Response(JSON.stringify({ url: data.signedUrl }),{ headers:{ "Content-Type":"application/json"}});
});
