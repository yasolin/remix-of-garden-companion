import { supabase } from "@/integrations/supabase/client";

/** Returns a valid (refreshed if needed) access token; throws AUTH_REQUIRED if signed out. */
export async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  let session = data.session;

  // Refresh if missing or expiring within 60 seconds
  const expiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
  if (!session || expiresAt - Date.now() < 60_000) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed.session ?? session;
  }

  const token = session?.access_token;
  if (!token) throw new Error("AUTH_REQUIRED");
  return token;
}
