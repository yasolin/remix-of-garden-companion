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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Sync auth metadata to profiles row on sign-in.
      // IMPORTANT: never await supabase calls inside this callback — it runs
      // while the auth lock is held, so awaiting client calls here deadlocks
      // every later getSession/query. Defer to a macrotask instead.
      if (_event === "SIGNED_IN" && session?.user) {
        const u = session.user;
        setTimeout(() => { void syncProfileFromMetadata(u); }, 0);
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
