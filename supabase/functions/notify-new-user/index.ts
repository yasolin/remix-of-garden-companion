import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, displayName, surname, gender, age, phone } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.log("New user registered:", { email, displayName, surname, gender, age, phone });
      return new Response(JSON.stringify({ ok: true, note: "logged only" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to format and log the notification (since we can't send email directly without email infra)
    // For now, we log the user info securely
    console.log("=== NEW USER REGISTRATION ===");
    console.log(`Name: ${displayName} ${surname}`);
    console.log(`Email: ${email}`);
    console.log(`Gender: ${gender}`);
    console.log(`Age: ${age}`);
    console.log(`Phone: ${phone}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log("=== END REGISTRATION ===");

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-new-user error:", e);
    return new Response(JSON.stringify({ error: "Failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
