import { Home, Bot, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tabs = [
    { path: "/", label: t("nav.home"), icon: Home },
    { path: "/ai-assistant", label: t("nav.aiAssistant"), icon: Bot, isCenter: true },
    { path: "/profile", label: t("nav.profile"), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card shadow-nav border-t border-border">
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <button key={tab.path} onClick={() => navigate(tab.path)} className="relative -mt-6">
                <motion.div whileTap={{ scale: 0.9 }} className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <span className="text-[10px] font-semibold text-primary mt-1 block text-center">{tab.label}</span>
              </button>
            );
          }

          return (
            <button key={tab.path} onClick={() => navigate(tab.path)} className="flex flex-col items-center gap-0.5 py-1 px-3 relative">
              <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-semibold transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>{tab.label}</span>
              {isActive && <motion.div layoutId="activeTab" className="absolute -top-1 w-8 h-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
