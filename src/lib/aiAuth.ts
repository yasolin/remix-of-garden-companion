import { supabase } from "@/integrations/supabase/client";

/** Returns the current user's access token; throws if not signed in. */
export async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("AUTH_REQUIRED");
  return token;
}
