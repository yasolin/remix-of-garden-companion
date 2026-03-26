import { ArrowLeft, Settings, Bell, HelpCircle, LogOut, ChevronRight, Leaf, Globe, Camera, Shield, Star, Heart, User, Edit3, Sprout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchUserPlants } from "@/lib/plantService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const languages = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

type ProfileView = "main" | "editProfile" | "notifications" | "settings" | "privacy" | "help" | "premium";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [selectedLang, setSelectedLang] = useState(i18n.language);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [view, setView] = useState<ProfileView>("main");
  const [displayName, setDisplayName] = useState("");
  const [notifSettings, setNotifSettings] = useState({ watering: true, harvest: true, planting: true });

  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles" as any).select("*").eq("id", user!.id).maybeSingle();
      const p = data as any;
      if (p) setDisplayName(p.display_name || "");
      return p;
    },
    enabled: !!user,
  });

  const harvestReady = plants.filter(p => (p.days_to_harvest ?? 30) <= 7).length;
  const waterNeeded = plants.filter(p => p.needs_watering).length;

  const changeLang = (code: string) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
    localStorage.setItem("gardenPotLang", code);
    setShowLangPicker(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles" as any).update({ display_name: displayName } as any).eq("id", user.id);
    if (error) toast({ title: "❌", description: error.message, variant: "destructive" });
    else { toast({ title: "✅", description: t("profile.saveProfile") }); setView("main"); }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const achievements = [
    { emoji: "🌱", label: t("profile.firstPlanting") },
    { emoji: "💧", label: t("profile.loyalWaterer") },
    { emoji: "🍅", label: t("profile.firstHarvest") },
    { emoji: "🌿", label: t("profile.plantFriend") },
  ];

  // Sub-views
  if (view === "editProfile") {
    return (
      <div className="pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => setView("main")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("profile.editProfile")}</h1>
        </div>
        <div className="px-4 mt-4 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">{t("profile.displayName")}</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full mt-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveProfile}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl">
            {t("profile.saveProfile")}
          </motion.button>
        </div>
      </div>
    );
  }

  if (view === "notifications") {
    return (
      <div className="pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => setView("main")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("profile.notifications")}</h1>
        </div>
        <div className="px-4 mt-4 space-y-3">
          {[
            { key: "watering", label: t("profile.wateringNotif") },
            { key: "harvest", label: t("profile.harvestNotif") },
            { key: "planting", label: t("profile.plantingNotif") },
          ].map(item => (
            <div key={item.key} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{item.label}</span>
              <button onClick={() => setNotifSettings(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className={`w-12 h-7 rounded-full transition-colors relative ${notifSettings[item.key as keyof typeof notifSettings] ? "bg-primary" : "bg-muted"}`}>
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-card shadow transition-transform ${notifSettings[item.key as keyof typeof notifSettings] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === "settings") {
    return (
      <div className="pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => setView("main")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("profile.settings")}</h1>
        </div>
        <div className="px-4 mt-4 space-y-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-3">{t("profile.fontSize")}</h3>
            <div className="flex gap-2">
              {(["small", "medium", "large"] as const).map(size => (
                <button key={size}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  {t(`profile.${size}`)}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setShowLangPicker(!showLangPicker)}
            className="w-full bg-card rounded-xl p-4 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">{t("profile.language")}</span>
            </div>
            <span className="text-sm text-muted-foreground">{languages.find(l => l.code === selectedLang)?.label}</span>
          </button>
          {showLangPicker && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {languages.map(lang => (
                <button key={lang.code} onClick={() => changeLang(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${selectedLang === lang.code ? "bg-primary/10" : "hover:bg-secondary"}`}>
                  <span className="text-xl">{lang.flag}</span>
                  <span className={`text-sm font-semibold ${selectedLang === lang.code ? "text-primary" : "text-foreground"}`}>{lang.label}</span>
                  {selectedLang === lang.code && <Heart className="w-4 h-4 text-primary ml-auto fill-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "privacy") {
    return (
      <div className="pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => setView("main")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("profile.privacyTitle")}</h1>
        </div>
        <div className="px-4 mt-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">{t("profile.privacyText")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === "help") {
    return (
      <div className="pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => setView("main")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("profile.helpTitle")}</h1>
        </div>
        <div className="px-4 mt-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">{t("profile.helpText")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === "premium") {
    return (
      <div className="pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => setView("main")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("profile.premiumTitle")}</h1>
        </div>
        <div className="px-4 mt-4 space-y-4">
          {[
            { name: t("profile.premiumMonthly"), price: "₺49.99/ay", period: "monthly" },
            { name: t("profile.premiumYearly"), price: "₺399.99/yıl", period: "yearly" },
          ].map(plan => (
            <div key={plan.period} className="bg-card rounded-2xl p-5 border border-border shadow-card">
              <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
              <p className="text-2xl font-bold text-primary mt-1">{plan.price}</p>
              <p className="text-xs text-muted-foreground mt-2">{t("profile.premiumFeatures")}</p>
              <button className="w-full mt-4 bg-primary text-primary-foreground font-bold py-3 rounded-xl">
                {t("profile.subscribe")}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Main profile view
  const menuSections = [
    {
      title: t("profile.general"),
      items: [
        { icon: Edit3, label: t("profile.editProfile"), desc: t("profile.editProfileDesc"), action: () => setView("editProfile") },
        { icon: Leaf, label: t("profile.myPlants"), desc: t("profile.myPlantsDesc"), action: () => navigate("/my-plants") },
        { icon: Bell, label: t("profile.notifications"), desc: t("profile.notificationsDesc"), action: () => setView("notifications") },
      ],
    },
    {
      title: t("profile.app"),
      items: [
        { icon: Settings, label: t("profile.settings"), desc: t("profile.settingsDesc"), action: () => setView("settings") },
        { icon: Shield, label: t("profile.privacy"), desc: t("profile.privacyDesc"), action: () => setView("privacy") },
        { icon: HelpCircle, label: t("profile.help"), desc: t("profile.helpDesc"), action: () => setView("help") },
      ],
    },
    {
      title: t("profile.account"),
      items: [
        { icon: Star, label: t("profile.premium"), desc: t("profile.premiumDesc"), action: () => setView("premium") },
        { icon: LogOut, label: t("profile.logout"), desc: t("profile.logoutDesc"), action: handleLogout },
      ],
    },
  ];

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("profile.title")}</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 gradient-harvest rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center border-2 border-primary-foreground/30">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-primary-foreground">{profile?.display_name || t("profile.gardener")}</h2>
            <p className="text-sm text-primary-foreground/80">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-primary-foreground/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <p className="text-xl font-bold text-primary-foreground">{plants.length}</p>
            <p className="text-[10px] text-primary-foreground/70 font-semibold">{t("profile.plants")}</p>
          </div>
          <div className="bg-primary-foreground/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <p className="text-xl font-bold text-primary-foreground">{harvestReady}</p>
            <p className="text-[10px] text-primary-foreground/70 font-semibold">{t("profile.harvestReady")}</p>
          </div>
          <div className="bg-primary-foreground/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <p className="text-xl font-bold text-primary-foreground">{waterNeeded}</p>
            <p className="text-[10px] text-primary-foreground/70 font-semibold">{t("profile.watering")}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mx-4 mt-4 bg-card rounded-2xl p-4 shadow-card border border-border">
        <h3 className="font-bold text-sm text-foreground mb-3">{t("profile.achievements")}</h3>
        <div className="flex gap-3">
          {achievements.map((badge) => (
            <div key={badge.label} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-xl">{badge.emoji}</div>
              <span className="text-[9px] font-semibold text-muted-foreground text-center">{badge.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {menuSections.map((section, si) => (
        <div key={section.title} className="px-4 mt-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{section.title}</h3>
          <div className="space-y-1.5">
            {section.items.map((item, i) => (
              <motion.button key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (si * 3 + i) * 0.05 }} onClick={item.action}
                className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:bg-secondary transition-colors">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        </div>
      ))}

      <p className="text-center text-[10px] text-muted-foreground mt-8 mb-4">Garden Pot v1.0.0 🌿</p>
    </div>
  );
};

export default ProfilePage;
