import { ArrowLeft, Settings, Bell, HelpCircle, LogOut, ChevronRight, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const menuItems = [
  { icon: Bell, label: "Bildirimler", desc: "Sulama & hasat hatırlatmaları" },
  { icon: Settings, label: "Ayarlar", desc: "Uygulama tercihleri" },
  { icon: HelpCircle, label: "Yardım", desc: "SSS ve destek" },
  { icon: LogOut, label: "Çıkış Yap", desc: "Hesabından çıkış yap" },
];

const ProfilePage = () => {
  const navigate = useNavigate();

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
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 bg-card rounded-2xl p-5 shadow-card border border-border flex items-center gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Leaf className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-foreground">Bahçıvan</h2>
          <p className="text-sm text-muted-foreground">4 bitki yetiştiriyor 🌱</p>
        </div>
      </motion.div>

      {/* Menu */}
      <div className="px-4 mt-6 space-y-2">
        {menuItems.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
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
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
