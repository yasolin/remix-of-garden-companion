import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode, imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompts: Record<string, string> = {
      chat: "You are a helpful plant care assistant called Garden Pot AI. You help users with plant care, disease detection, plant identification, and gardening advice. Keep answers clear, practical, and friendly. Use plant emojis. Respond in the same language the user writes in.",
      disease: "You are a plant disease detection expert. Analyze the plant image and identify any diseases, pests, or health issues. Provide the disease name, symptoms, causes, and treatment recommendations. Be specific and practical. Respond in the same language as the user's message.",
      identify: "You are a plant identification expert. Analyze the image and identify the plant species. Provide the common name, scientific name, care requirements (sunlight, watering, soil type, temperature), and interesting facts. Respond in the same language as the user's message.",
      location: "You are a plant placement expert. Analyze the location/environment shown in the image and recommend which plants would thrive there. Consider light conditions, space, temperature, and humidity. Respond in the same language as the user's message.",
      analyze_plant: "You are a plant care expert. Analyze the plant image and return a JSON object with these fields: name (common name), scientificName, placement (recommended), waterFrequency, sunlight, windSensitivity, temperature, humidity, soilType, fertilizer, notes. Respond ONLY with the JSON object, no other text.",
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.chat;

    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (imageBase64 && (mode === "disease" || mode === "identify" || mode === "location" || mode === "analyze_plant")) {
      aiMessages.push({
        role: "user",
        content: [
          { type: "text", text: messages?.[messages.length - 1]?.content || "Analyze this plant image." },
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
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
