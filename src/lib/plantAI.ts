import { getAccessToken } from "@/lib/aiAuth";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plant-ai`;

export type AiMessage = { role: "user" | "assistant"; content: string };

export type PlantAnalysis = Record<string, string> & {
  name: string;
  scientificName?: string;
  diagnosis?: string;
  severity?: string;
  treatment?: string;
};

interface StreamChatOptions {
  messages: AiMessage[];
  mode?: string;
  imageBase64?: string;
  lang?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}

export async function streamPlantAI({ messages, mode = "chat", imageBase64, lang, onDelta, onDone, signal }: StreamChatOptions) {
  const controller = signal ? null : new AbortController();
  const timeout = controller ? window.setTimeout(() => controller.abort(), 60_000) : null;
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await getAccessToken()}`,
    },
    body: JSON.stringify({ messages, mode, imageBase64, lang: lang || "en" }),
    signal: signal || controller?.signal,
  });

  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    if (resp.status === 401) throw new Error("Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.");
    if (resp.status === 429) throw new Error("Çok fazla istek. Lütfen biraz sonra tekrar deneyin.");
    if (resp.status === 402) throw new Error("AI kredisi tükendi. Lütfen kredi ekleyin.");
    if (resp.status === 403) throw new Error(err.error || "AI erişimi çalışma alanı ayarları nedeniyle kapalı.");
    throw new Error(err.error || err.message || `HTTP ${resp.status}`);
  }


  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }
  onDone();
  if (timeout) window.clearTimeout(timeout);
}

export async function analyzePlantPhoto(imageBase64: string, lang?: string, mode: "analyze_plant" | "analyze_disease" = "analyze_plant"): Promise<PlantAnalysis> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60_000);
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await getAccessToken()}`,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Analyze this plant and provide care information as JSON." }],
      mode,
      imageBase64,
      lang: lang || "en",
    }),
    signal: controller.signal,
  });

  if (!resp.ok || !resp.body) {
    const body = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    if (resp.status === 401) throw new Error("Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.");
    if (resp.status === 429) throw new Error("Çok fazla istek. Lütfen biraz sonra tekrar deneyin.");
    if (resp.status === 402) throw new Error(body.error || "AI kredisi tükendi.");
    throw new Error(body.error || "Bitki analiz edilemedi");
  }


  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let result = "";
  let textBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) result += content;
      } catch { /* ignore partial */ }
    }
  }

  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    window.clearTimeout(timeout);
    return JSON.parse(jsonMatch[0]) as PlantAnalysis;
  }
  throw new Error("Could not parse AI response");
}
