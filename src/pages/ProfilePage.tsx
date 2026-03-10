import { ArrowLeft, Settings, Bell, HelpCircle, LogOut, ChevronRight, Leaf, Globe, Camera, Shield, Star, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { myPlants } from "@/data/mockData";

const languages = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState("tr");
  const [showLangPicker, setShowLangPicker] = useState(false);

  const harvestReady = myPlants.filter(p => p.daysToHarvest <= 7).length;
  const waterNeeded = myPlants.filter(p => p.needsWatering).length;

  const menuSections = [
    {
      title: "Genel",
      items: [
        { icon: Bell, label: "Bildirimler", desc: "Sulama & hasat hatırlatmaları", action: () => {} },
        { icon: Globe, label: "Dil / Language", desc: languages.find(l => l.code === selectedLang)?.label, action: () => setShowLangPicker(!showLangPicker) },
      ],
    },
    {
      title: "Uygulama",
      items: [
        { icon: Settings, label: "Ayarlar", desc: "Uygulama tercihleri", action: () => {} },
        { icon: Shield, label: "Gizlilik", desc: "Veri ve gizlilik ayarları", action: () => {} },
        { icon: HelpCircle, label: "Yardım", desc: "SSS ve destek", action: () => {} },
      ],
    },
    {
      title: "Hesap",
      items: [
        { icon: Star, label: "Premium", desc: "Gelişmiş özelliklere eriş", action: () => {} },
        { icon: LogOut, label: "Çıkış Yap", desc: "Hesabından çıkış yap", action: () => {} },
      ],
    },
  ];

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Profil</h1>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 gradient-harvest rounded-2xl p-5 relative overflow-hidden"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-18 h-18 rounded-full bg-primary-foreground/20 flex items-center justify-center border-2 border-primary-foreground/30">
              <Leaf className="w-9 h-9 text-primary-foreground" />
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-foreground flex items-center justify-center shadow-lg">
              <Camera className="w-3.5 h-3.5 text-primary" />
            </button>
          </div>
          <div>
            <h2 className="font-bold text-lg text-primary-foreground">Bahçıvan</h2>
            <p className="text-sm text-primary-foreground/80">Hobi bahçecisi 🌱</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-primary-foreground/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <p className="text-xl font-bold text-primary-foreground">{myPlants.length}</p>
            <p className="text-[10px] text-primary-foreground/70 font-semibold">Bitki</p>
          </div>
          <div className="bg-primary-foreground/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <p className="text-xl font-bold text-primary-foreground">{harvestReady}</p>
            <p className="text-[10px] text-primary-foreground/70 font-semibold">Hasat Hazır</p>
          </div>
          <div className="bg-primary-foreground/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <p className="text-xl font-bold text-primary-foreground">{waterNeeded}</p>
            <p className="text-[10px] text-primary-foreground/70 font-semibold">Sulama</p>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-4 mt-4 bg-card rounded-2xl p-4 shadow-card border border-border"
      >
        <h3 className="font-bold text-sm text-foreground mb-3">Başarılar</h3>
        <div className="flex gap-3">
          {[
            { emoji: "🌱", label: "İlk Ekim" },
            { emoji: "💧", label: "Sadık Sulayıcı" },
            { emoji: "🍅", label: "İlk Hasat" },
            { emoji: "🌿", label: "Bitki Dostu" },
          ].map((badge) => (
            <div key={badge.label} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-xl">
                {badge.emoji}
              </div>
              <span className="text-[9px] font-semibold text-muted-foreground text-center">{badge.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Menu Sections */}
      {menuSections.map((section, si) => (
        <div key={section.title} className="px-4 mt-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {section.title}
          </h3>
          <div className="space-y-1.5">
            {section.items.map((item, i) => (
              <div key={item.label}>
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (si * 3 + i) * 0.05 }}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:bg-secondary transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>

                {/* Language Picker Dropdown */}
                {item.label === "Dil / Language" && showLangPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-1.5 bg-card rounded-xl border border-border overflow-hidden"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSelectedLang(lang.code);
                          setShowLangPicker(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                          selectedLang === lang.code
                            ? "bg-primary/10"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className={`text-sm font-semibold ${
                          selectedLang === lang.code ? "text-primary" : "text-foreground"
                        }`}>
                          {lang.label}
                        </span>
                        {selectedLang === lang.code && (
                          <Heart className="w-4 h-4 text-primary ml-auto fill-primary" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* App version */}
      <p className="text-center text-[10px] text-muted-foreground mt-8 mb-4">
        Garden Pot v1.0.0 🌿
      </p>
    </div>
  );
};

export default ProfilePage;
