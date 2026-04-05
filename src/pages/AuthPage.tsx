import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Phone, Briefcase, Calendar, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

type AuthMode = "login" | "signup";

const KVKK_TEXT_TR = `Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında, Garden Pot uygulamasına kayıt olarak aşağıdaki koşulları kabul etmiş olursunuz:

• Kişisel verileriniz (ad, soyad, e-posta, telefon, yaş, cinsiyet, meslek) uygulama hizmetlerinin sunulması amacıyla işlenecektir.
• Bitki fotoğrafları ve konum verileri, kişiselleştirilmiş bahçecilik önerileri sunmak amacıyla kullanılacaktır.
• Verileriniz üçüncü taraflarla paylaşılmayacak ve yalnızca uygulama hizmetleri kapsamında saklanacaktır.
• Dilediğiniz zaman verilerinizin silinmesini talep edebilirsiniz.
• Detaylı bilgi için gizlilik politikamızı inceleyebilirsiniz.`;

const KVKK_TEXT_EN = `By registering to Garden Pot, you agree to the following terms under our Privacy Policy:

• Your personal data (name, surname, email, phone, age, gender, occupation) will be processed for providing app services.
• Plant photos and location data will be used to provide personalized gardening recommendations.
• Your data will not be shared with third parties and will only be stored within the scope of app services.
• You can request the deletion of your data at any time.
• Please review our privacy policy for detailed information.`;

const AuthPage = () => {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [surname, setSurname] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [showKvkk, setShowKvkk] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    if (mode === "signup" && !kvkkAccepted) {
      toast({ title: "⚠️", description: i18n.language === "tr" ? "KVKK onayı gereklidir" : "Privacy consent is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { display_name: displayName, surname, age: age ? parseInt(age) : null, gender, occupation, phone },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        // Update profile with extra fields after signup
        // The trigger will create the profile, we update it after
        setEmailSent(true);
        toast({ title: "✅", description: t("auth.verifyEmail") });

        // Send notification to app owner
        try {
          await supabase.functions.invoke("notify-new-user", {
            body: { email, displayName, surname, gender, age, phone },
          });
        } catch {}
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
            className="mt-4 text-sm font-semibold text-primary">{t("auth.backToLogin")}</button>
        </motion.div>
      </div>
    );
  }

  const isTr = i18n.language === "tr";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2 mb-8">
          <img src={logo} alt="GardenPot" className="h-36 object-contain" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="w-full max-w-sm space-y-3">
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
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isTr ? "Adınız" : "First Name"}
                    className="w-full bg-secondary rounded-xl pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={surname} onChange={(e) => setSurname(e.target.value)}
                    placeholder={isTr ? "Soyadınız" : "Last Name"}
                    className="w-full bg-secondary rounded-xl pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
                    placeholder={isTr ? "Yaş" : "Age"} maxLength={3}
                    className="w-full bg-secondary rounded-xl pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select value={gender} onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-secondary rounded-xl pl-10 pr-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 appearance-none">
                    <option value="">{isTr ? "Cinsiyet" : "Gender"}</option>
                    <option value="male">{isTr ? "Erkek" : "Male"}</option>
                    <option value="female">{isTr ? "Kadın" : "Female"}</option>
                    <option value="other">{isTr ? "Diğer" : "Other"}</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={occupation} onChange={(e) => setOccupation(e.target.value)}
                  placeholder={isTr ? "Mesleğiniz" : "Occupation"}
                  className="w-full bg-secondary rounded-xl pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)}
                  type="tel" placeholder={isTr ? "Telefon numarası" : "Phone number"}
                  className="w-full bg-secondary rounded-xl pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              type="email" placeholder={t("auth.emailPlaceholder")}
              className="w-full bg-secondary rounded-xl pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={password} onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"} placeholder={t("auth.passwordPlaceholder")}
              className="w-full bg-secondary rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={kvkkAccepted} onChange={(e) => setKvkkAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-xs text-muted-foreground">
                  {isTr ? "KVKK Aydınlatma Metni'ni okudum ve kabul ediyorum." : "I have read and accept the Privacy Policy."}
                  <button type="button" onClick={() => setShowKvkk(!showKvkk)} className="ml-1 text-primary font-semibold underline">
                    {isTr ? "Oku" : "Read"}
                  </button>
                </span>
              </label>
              {showKvkk && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="bg-secondary rounded-xl p-3 max-h-40 overflow-y-auto">
                  <p className="text-[11px] text-muted-foreground whitespace-pre-line">
                    {isTr ? KVKK_TEXT_TR : KVKK_TEXT_EN}
                  </p>
                </motion.div>
              )}
            </div>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading}
            className="w-full gradient-harvest text-primary-foreground font-bold py-3 rounded-xl disabled:opacity-50">
            {loading ? "..." : mode === "login" ? t("auth.loginBtn") : t("auth.signupBtn")}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
