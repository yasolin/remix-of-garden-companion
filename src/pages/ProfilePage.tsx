import { ArrowLeft, Settings, Bell, HelpCircle, LogOut, ChevronRight, Leaf, Globe, Shield, Star, User, Edit3, Plus, Sun, Droplets, Wind, Camera, Trash2, Award, Crown, Zap, Target, LayoutGrid, LayoutList, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserPlants, uploadPlantPhoto, deletePlant } from "@/lib/plantService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const languages = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

type ProfileView = "main" | "editProfile" | "settingsMenu" | "premium";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLang, setSelectedLang] = useState(i18n.language);
  const [view, setView] = useState<ProfileView>("main");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [notifSettings, setNotifSettings] = useState({ watering: true, harvest: true, planting: true });
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">(() => {
    return (localStorage.getItem("gardenPotFontSize") as any) || "medium";
  });

  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles" as any).select("*").eq("id", user!.id).maybeSingle();
      const p = data as any;
      if (p) {
        setDisplayName(p.display_name || "");
        setAvatarUrl(p.avatar_url || null);
      }
      return p;
    },
    enabled: !!user,
  });

  useEffect(() => {
    const sizes = { small: "14px", medium: "16px", large: "18px" };
    document.documentElement.style.fontSize = sizes[fontSize];
    localStorage.setItem("gardenPotFontSize", fontSize);
  }, [fontSize]);

  const harvestReady = plants.filter(p => (p.days_to_harvest ?? 30) <= 7).length;
  const waterNeeded = plants.filter(p => p.needs_watering).length;

  const changeLang = (code: string) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
    localStorage.setItem("gardenPotLang", code);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `avatars/${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("plant-photos").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("plant-photos").getPublicUrl(path);
      const url = data.publicUrl;
      await supabase.from("profiles" as any).update({ avatar_url: url } as any).eq("id", user.id);
      setAvatarUrl(url);
      toast({ title: "✅", description: t("profile.photoUpdated") });
    } catch (e: any) {
      toast({ title: "❌", description: e.message, variant: "destructive" });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles" as any).update({ display_name: displayName } as any).eq("id", user.id);
    if (error) toast({ title: "❌", description: error.message, variant: "destructive" });
    else { toast({ title: "✅", description: t("profile.saveProfile") }); refetchProfile(); setView("main"); }
  };

  const handleDeletePlant = async (plantId: string, plantName: string) => {
    if (!confirm(t("profile.confirmDelete", { name: plantName }))) return;
    try {
      await deletePlant(plantId);
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      toast({ title: "✅", description: t("profile.plantDeleted") });
    } catch (e: any) {
      toast({ title: "❌", description: e.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => { await signOut(); };

  const achievements = [
    { icon: Leaf, label: t("profile.firstPlanting"), color: "bg-primary/15 text-primary", unlocked: plants.length > 0 },
    { icon: Droplets, label: t("profile.loyalWaterer"), color: "bg-blue-500/15 text-blue-500", unlocked: plants.some(p => !p.needs_watering) },
    { icon: Target, label: t("profile.firstHarvest"), color: "bg-accent/15 text-accent", unlocked: plants.some(p => (p.days_to_harvest ?? 30) <= 0) },
    { icon: Crown, label: t("profile.plantFriend"), color: "bg-purple-500/15 text-purple-500", unlocked: plants.length >= 5 },
  ];

  // Edit Profile sub-view
  if (view === "editProfile") {
    return (
      <div className="pb-24 max-w-lg mx-auto">
        <input ref={avatarRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => setView("main")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("profile.editProfile")}</h1>
        </div>
        <div className="px-4 mt-4 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover border-3 border-primary/20" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center border-3 border-primary/20">
                  <User className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <button onClick={() => avatarRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
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

  // Settings menu
  if (view === "settingsMenu") {
    return (
      <div className="pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => setView("main")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("profile.settings")}</h1>
        </div>
        <div className="px-4 mt-4 space-y-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4" /> {t("profile.notifications")}
            </h3>
            <div className="space-y-3">
              {[
                { key: "watering", label: t("profile.wateringNotif") },
                { key: "harvest", label: t("profile.harvestNotif") },
                { key: "planting", label: t("profile.plantingNotif") },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <button onClick={() => setNotifSettings(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                    className={`w-11 h-6 rounded-full transition-colors relative ${notifSettings[item.key as keyof typeof notifSettings] ? "bg-primary" : "bg-muted"}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${notifSettings[item.key as keyof typeof notifSettings] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-3">{t("profile.fontSize")}</h3>
            <div className="flex gap-2">
              {(["small", "medium", "large"] as const).map(size => (
                <button key={size} onClick={() => setFontSize(size)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    fontSize === size ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}>
                  {t(`profile.${size}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" /> {t("profile.language")}
            </h3>
            <div className="space-y-1">
              {languages.map(lang => (
                <button key={lang.code} onClick={() => changeLang(lang.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    selectedLang === lang.code ? "bg-primary/10" : "hover:bg-secondary"
                  }`}>
                  <span className="text-lg">{lang.flag}</span>
                  <span className={`text-sm font-semibold ${selectedLang === lang.code ? "text-primary" : "text-foreground"}`}>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> {t("profile.privacy")}
            </h3>
            <p className="text-xs text-muted-foreground">{t("profile.privacyText")}</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> {t("profile.help")}
            </h3>
            <p className="text-xs text-muted-foreground">{t("profile.helpText")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Premium sub-view
  if (view === "premium") {
    const premiumFeatures = [
      t("profile.premiumFeature1"),
      t("profile.premiumFeature2"),
      t("profile.premiumFeature3"),
      t("profile.premiumFeature4"),
    ];

    return (
      <div className="pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => setView("main")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("profile.premiumTitle")}</h1>
        </div>

        {/* Premium hero */}
        <div className="mx-4 mt-4 bg-gradient-to-br from-primary/10 via-accent/5 to-purple-500/10 rounded-2xl p-6 border border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Garden Pot Premium</h2>
              <p className="text-xs text-muted-foreground">{t("profile.premiumSubtitle")}</p>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            {premiumFeatures.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 mt-5 space-y-3">
          {[
            { name: t("profile.premiumMonthly"), price: "₺49.99", period: t("profile.perMonth"), popular: false },
            { name: t("profile.premiumYearly"), price: "₺399.99", period: t("profile.perYear"), popular: true, save: t("profile.save33") },
          ].map(plan => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`bg-card rounded-2xl p-5 border ${plan.popular ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border"} relative`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-bold px-3 py-1 rounded-full">
                  {t("profile.mostPopular")}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">{plan.name}</h3>
                  {plan.save && <span className="text-xs text-primary font-semibold">{plan.save}</span>}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{plan.price}</p>
                  <p className="text-xs text-muted-foreground">{plan.period}</p>
                </div>
              </div>
              <button className={`w-full mt-4 font-bold py-3 rounded-xl transition-colors ${
                plan.popular ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"
              }`}>
                {t("profile.subscribe")}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Main profile view
  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("profile.title")}</h1>
        </div>
        <button onClick={() => setView("settingsMenu")} className="p-2 rounded-lg hover:bg-secondary">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Profile card - social style */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-3 bg-card rounded-2xl p-5 border border-border shadow-card">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-3 border-primary/20 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <h2 className="font-bold text-lg text-foreground mt-3">{profile?.display_name || displayName || t("profile.gardener")}</h2>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <button onClick={() => setView("editProfile")}
            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            <Edit3 className="w-3 h-3" /> {t("profile.editProfile")}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-secondary rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-foreground">{plants.length}</p>
            <p className="text-[10px] text-muted-foreground font-semibold">{t("profile.plants")}</p>
          </div>
          <div className="bg-secondary rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-foreground">{harvestReady}</p>
            <p className="text-[10px] text-muted-foreground font-semibold">{t("profile.harvestReady")}</p>
          </div>
          <div className="bg-secondary rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-foreground">{waterNeeded}</p>
            <p className="text-[10px] text-muted-foreground font-semibold">{t("profile.watering")}</p>
          </div>
        </div>
      </motion.div>

      {/* Achievements - modern badges */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mx-4 mt-3 bg-card rounded-2xl p-4 shadow-card border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Award className="w-4 h-4 text-accent" /> {t("profile.achievements")}
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {achievements.map((badge) => (
            <div key={badge.label} className="flex flex-col items-center gap-1.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                badge.unlocked ? badge.color : "bg-muted/50 text-muted-foreground/30"
              }`}>
                <badge.icon className="w-6 h-6" />
              </div>
              <span className={`text-[9px] font-semibold text-center leading-tight ${
                badge.unlocked ? "text-foreground" : "text-muted-foreground/50"
              }`}>{badge.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* My Plants */}
      <div className="mx-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground">{t("profile.myPlants")}</h3>
          <button onClick={() => navigate("/add-plant")} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
        {plants.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-border text-center">
            <Leaf className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("plants.noPlants")}</p>
            <button onClick={() => navigate("/add-plant")} className="mt-3 bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-bold">
              {t("plants.addFirst")}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {plants.map((plant, i) => (
              <motion.div key={plant.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                <div onClick={() => navigate(`/plant/${plant.id}`)} className="flex items-center gap-3 flex-1 cursor-pointer">
                  {plant.photo_url ? (
                    <img src={plant.photo_url} alt={plant.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                      <Leaf className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground">{plant.name}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">{plant.scientific_name || plant.placement}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-accent" />
                  <Droplets className="w-3.5 h-3.5 text-primary" />
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeletePlant(plant.id, plant.name); }}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4 text-destructive/60 hover:text-destructive" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-4 mt-5 space-y-1.5">
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setView("premium")}
          className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:bg-secondary transition-colors">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm font-semibold text-foreground">{t("profile.premium")}</span>
            <p className="text-[11px] text-muted-foreground">{t("profile.premiumDesc")}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.button>

        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:bg-destructive/5 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm font-semibold text-destructive">{t("profile.logout")}</span>
          </div>
        </button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-6 mb-4">Garden Pot v1.0.0 🌿</p>
    </div>
  );
};

export default ProfilePage;
