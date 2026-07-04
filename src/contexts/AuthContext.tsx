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
          if (meta.surname) updates.surname = meta.surname;
          if (meta.age) updates.age = meta.age;
          if (meta.gender) updates.gender = meta.gender;
          if (meta.occupation) updates.occupation = meta.occupation;
          if (meta.phone) updates.phone = meta.phone;
          if (meta.surname || meta.age || meta.gender || meta.occupation || meta.phone) {
            updates.kvkk_accepted = true;
          }
          if (Object.keys(updates).length > 0) {
            await supabase.from("profiles").update(updates).eq("user_id", session.user.id);
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
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("signOut error", e);
    }
    // Force local state reset in case listener is slow / offline
    setUser(null);
    setSession(null);
    // Full reload guarantees redirect to auth page and clears cached queries
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
