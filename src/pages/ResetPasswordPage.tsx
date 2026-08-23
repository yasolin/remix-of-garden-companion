import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    setReady(hash.get("type") === "recovery" || query.get("type") === "recovery" || Boolean(hash.get("access_token")));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const updatePassword = async () => {
    if (password.length < 8) {
      toast({ title: "Şifre en az 8 karakter olmalı", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Şifreler eşleşmiyor", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast({ title: "Şifre güncellenemedi", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Şifreniz yenilendi" });
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background px-6 flex items-center justify-center">
      <section className="w-full max-w-sm space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Yeni şifre belirle</h1>
          <p className="mt-2 text-sm text-muted-foreground">Hesabınız için güvenli bir şifre oluşturun.</p>
        </div>
        {!ready ? (
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Bu bağlantı geçersiz veya süresi dolmuş. Giriş ekranından yeni bir şifre sıfırlama bağlantısı isteyin.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} placeholder="Yeni şifre" className="w-full rounded-lg bg-secondary py-3 pl-10 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              <button type="button" aria-label="Şifreyi göster" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type={showPassword ? "text" : "password"} placeholder="Yeni şifreyi tekrar girin" className="w-full rounded-lg bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
            <Button className="w-full" disabled={saving} onClick={updatePassword}>{saving ? "Güncelleniyor..." : "Şifreyi güncelle"}</Button>
          </div>
        )}
        <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>Giriş ekranına dön</Button>
      </section>
    </main>
  );
};

export default ResetPasswordPage;