import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Sync auth metadata to profiles row on sign-in
      if (_event === "SIGNED_IN" && session?.user) {
        const meta = session.user.user_metadata || {};
        try {
          const { data: existing } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("user_id", session.user.id)
            .maybeSingle();
          const updates: any = {};
          if (!existing?.display_name && meta.display_name) updates.display_name = meta.display_name;
          if (!existing?.avatar_url && meta.avatar_url) updates.avatar_url = meta.avatar_url;
          const hasPii = !!(meta.surname || meta.age || meta.gender || meta.occupation || meta.phone);
          if (hasPii) updates.kvkk_accepted = true;
          if (Object.keys(updates).length > 0) {
            await supabase.from("profiles").update(updates).eq("user_id", session.user.id);
          }
          if (hasPii) {
            await supabase.from("profiles_private" as any).upsert({
              user_id: session.user.id,
              surname: meta.surname ?? null,
              age: meta.age ?? null,
              gender: meta.gender ?? null,
              occupation: meta.occupation ?? null,
              phone: meta.phone ?? null,
            } as any, { onConflict: "user_id" } as any);
          }
        } catch {}

      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Clear local state immediately so UI never appears "stuck"
    setUser(null);
    setSession(null);
    try {
      // Local scope + timeout: never hang on a slow/offline network call
      await Promise.race([
        supabase.auth.signOut({ scope: "local" }),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch (e) {
      console.error("signOut error", e);
    }
    try {
      // Remove any lingering supabase auth tokens
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-") && k.includes("auth-token"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  };


  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
