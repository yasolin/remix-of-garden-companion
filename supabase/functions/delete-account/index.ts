import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod";

const BodySchema = z.object({
  password: z.string().min(1).max(256),
  reason: z.string().trim().min(3).max(500),
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authHeader?.startsWith("Bearer ") || !url || !anonKey || !serviceKey) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return json({ error: "Silme nedeni ve şifre gereklidir." }, 400);

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const token = authHeader.slice("Bearer ".length);
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  const user = userData.user;
  if (userError || !user?.email) return json({ error: "Oturum doğrulanamadı." }, 401);

  const { error: passwordError } = await userClient.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });
  if (passwordError) return json({ error: "Şifre hatalı." }, 403);

  const admin = createClient(url, serviceKey);
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return json({ error: "Hesap silinemedi." }, 500);

  return json({ ok: true });
});