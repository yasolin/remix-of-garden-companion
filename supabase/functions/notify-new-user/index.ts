import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sanitize = (v: unknown, max = 120): string | null => {
  if (typeof v !== "string") return null;
  const clean = v.replace(/[\r\n\t]/g, " ").trim().slice(0, max);
  return clean.length ? clean : null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    let payload: Record<string, unknown> = {};
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }

    const displayName = sanitize(payload.displayName, 80);
    const surname = sanitize(payload.surname, 80);
    const gender = sanitize(payload.gender, 32);
    const phone = sanitize(payload.phone, 32);
    const ageRaw = payload.age;
    const ageNum = typeof ageRaw === "number" ? ageRaw : parseInt(String(ageRaw ?? ""), 10);
    const age = Number.isFinite(ageNum) && ageNum > 0 && ageNum < 130 ? ageNum : null;

    if (phone && !/^[0-9 +()\-]{5,32}$/.test(phone)) {
      return json({ error: "Invalid phone" }, 400);
    }

    // Email is taken from the verified session, never from client input.
    console.log("=== NEW USER REGISTRATION ===");
    console.log(JSON.stringify({
      userId: user.id,
      email: user.email,
      displayName,
      surname,
      gender,
      age,
      phone,
      time: new Date().toISOString(),
    }));
    console.log("=== END REGISTRATION ===");

    return json({ ok: true });
  } catch (e) {
    console.error("notify-new-user error:", e);
    return json({ error: "Failed" }, 500);
  }
});
