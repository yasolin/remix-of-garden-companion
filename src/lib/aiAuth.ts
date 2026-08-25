import { supabase } from "@/integrations/supabase/client";

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/** Last-resort: read the persisted session straight out of localStorage.
 *  The auth client's storage layer can stall (locks / brokered preview storage),
 *  which would otherwise make every AI request hang forever. */
function tokenFromLocalStorage(): { token: string; expiresAt: number } | null {
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith("sb-") || !key.includes("auth-token")) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      let value: any = raw;
      if (raw.startsWith("base64-")) {
        value = atob(raw.slice(7));
      }
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      const session = parsed?.access_token ? parsed : parsed?.currentSession ?? parsed?.session;
      if (session?.access_token) {
        return { token: session.access_token, expiresAt: (session.expires_at ?? 0) * 1000 };
      }
    }
  } catch { /* ignore */ }
  return null;
}

/** Returns a valid (refreshed if needed) access token; throws if signed out. */
export async function getAccessToken(): Promise<string> {
  const result = await withTimeout(supabase.auth.getSession(), 4000);
  let token = result?.data.session?.access_token ?? null;
  let expiresAt = result?.data.session?.expires_at ? result.data.session.expires_at * 1000 : 0;

  if (!token) {
    const fallback = tokenFromLocalStorage();
    if (fallback) {
      token = fallback.token;
      expiresAt = fallback.expiresAt;
    }
  }

  // Refresh only when missing or expiring within 60 seconds — never block forever.
  if (!token || expiresAt - Date.now() < 60_000) {
    const refreshed = await withTimeout(supabase.auth.refreshSession(), 6000);
    const newToken = refreshed?.data.session?.access_token;
    if (newToken) token = newToken;
  }

  if (!token) throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
  return token;
}
