import { useState } from "react";
import { motion } from "framer-motion";
import { Sprout, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type AuthMode = "login" | "signup";

const AuthPage = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setEmailSent(true);
        toast({ title: "✅", description: t("auth.verifyEmail") });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      toast({ title: "❌", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full gradient-harvest flex items-center justify-center">
            <Mail className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t("auth.checkEmail")}</h2>
          <p className="text-sm text-muted-foreground max-w-xs">{t("auth.checkEmailDesc")}</p>
          <button onClick={() => { setEmailSent(false); setMode("login"); }}
            className="mt-4 text-sm font-semibold text-primary">
            {t("auth.backToLogin")}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2 mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-harvest flex items-center justify-center">
            <Sprout className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Garden Pot</h1>
          <p className="text-sm text-muted-foreground">{t("auth.subtitle")}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="w-full max-w-sm space-y-4">
          
          {/* Tab toggle */}
          <div className="flex bg-secondary rounded-xl p-1">
            <button onClick={() => setMode("login")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}>{t("auth.login")}</button>
            <button onClick={() => setMode("signup")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}>{t("auth.signup")}</button>
          </div>

          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("auth.namePlaceholder")}
                className="w-full bg-secondary rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              type="email" placeholder={t("auth.emailPlaceholder")}
              className="w-full bg-secondary rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input value={password} onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"} placeholder={t("auth.passwordPlaceholder")}
              className="w-full bg-secondary rounded-xl pl-11 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading}
            className="w-full gradient-harvest text-primary-foreground font-bold py-3.5 rounded-xl disabled:opacity-50">
            {loading ? "..." : mode === "login" ? t("auth.loginBtn") : t("auth.signupBtn")}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
