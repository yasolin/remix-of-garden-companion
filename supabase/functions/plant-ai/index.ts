import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, mode, imageBase64, lang } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langInstruction = lang === "tr"
      ? "IMPORTANT: You MUST respond entirely in Turkish (Türkçe). Do not use English."
      : "IMPORTANT: You MUST respond entirely in English. Do not use other languages.";

    const systemPrompts: Record<string, string> = {
      chat: `You are a helpful plant care assistant called Garden Pot AI. You help users with plant care, disease detection, plant identification, and gardening advice. Keep answers clear, practical, and friendly. Use plant emojis. ${langInstruction}`,
      disease: `You are a plant disease detection expert. Analyze the plant image and identify any diseases, pests, or health issues. Provide the disease name, symptoms, causes, and treatment recommendations. Be specific and practical. ${langInstruction}`,
      identify: `You are a plant identification expert. Analyze the image and identify the plant species. Provide the common name, scientific name, care requirements (sunlight, watering, soil type, temperature), and interesting facts. ${langInstruction}`,
      location: `You are a plant placement expert. Analyze the location/environment shown in the image and recommend which plants would thrive there. Consider light conditions, space, temperature, and humidity. ${langInstruction}`,
      analyze_plant: `You are a plant care expert. Analyze the plant image and return a JSON object with these fields: name (common name), scientificName, placement (recommended), waterFrequency, sunlight, windSensitivity, temperature, humidity, soilType, fertilizer, notes. Respond ONLY with the JSON object, no other text. IMPORTANT: ALL field values MUST be in the same language as the user. ${langInstruction}`,
      analyze_disease: `Analyze the plant image for disease or pests. Return ONLY valid JSON with these string fields: name (the plant common name), scientificName, diagnosis, severity, treatment, notes. If no disease is visible, diagnosis must clearly say no disease detected. ${langInstruction}`,
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.chat;

    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (imageBase64) {
      // Always attach image when provided, regardless of mode (chat included).
      // Keep prior messages for context and append a vision message at the end.
      const prior = Array.isArray(messages) ? messages.slice(0, -1) : [];
      const lastText =
        (Array.isArray(messages) && messages[messages.length - 1]?.content) ||
        "Analyze this plant image.";
      aiMessages.push(...prior);
      aiMessages.push({
        role: "user",
        content: [
          { type: "text", text: lastText },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      });
    } else if (messages) {
      aiMessages.push(...messages);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      let message = `AI request failed (${response.status})`;
      try {
        const parsed = JSON.parse(t);
        message = parsed?.message || parsed?.error?.message || parsed?.error || message;
      } catch { /* keep fallback */ }
      return new Response(JSON.stringify({ error: message }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("plant-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
