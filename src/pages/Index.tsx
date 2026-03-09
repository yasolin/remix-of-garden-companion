import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Droplets, Sprout, Camera, Search } from "lucide-react";
import { myPlants, seasonalSuggestions } from "@/data/mockData";

const Index = () => {
  const navigate = useNavigate();
  const harvestSoon = myPlants.filter((p) => p.daysToHarvest <= 7).length;
  const needsWater = myPlants.filter((p) => p.needsWatering).length;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.1, duration: 0.4 },
    }),
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Sprout className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 bg-secondary rounded-full px-4 py-2.5 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ürün, kategori ara...</span>
        </div>
      </div>

      {/* Top 2 Cards */}
      <div className="px-4 grid grid-cols-2 gap-3 mt-2">
        <motion.div
          custom={0} initial="hidden" animate="visible" variants={cardVariants}
          onClick={() => navigate("/harvest")}
          className="gradient-harvest rounded-2xl p-4 cursor-pointer min-h-[140px] flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-primary-foreground font-bold text-base">Hasat Zamanı</h3>
            <p className="text-primary-foreground/80 text-xs mt-0.5">
              {harvestSoon} bitki hazır
            </p>
            <span className="inline-flex items-center gap-1 mt-2 bg-primary-foreground/20 text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
              📅 {harvestSoon} bitki
            </span>
          </div>
        </motion.div>

        <motion.div
          custom={1} initial="hidden" animate="visible" variants={cardVariants}
          onClick={() => navigate("/my-plants")}
          className="gradient-market rounded-2xl p-4 cursor-pointer min-h-[140px] flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-primary-foreground font-bold text-base">Bitkilerim</h3>
            <p className="text-primary-foreground/80 text-xs mt-0.5">
              {myPlants.length} bitki yetiştiriyorsun
            </p>
            <span className="inline-flex items-center gap-1 mt-2 bg-primary-foreground/20 text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
              🌱 Keşfet
            </span>
          </div>
        </motion.div>
      </div>

      {/* Bottom 2 Cards */}
      <div className="px-4 grid grid-cols-2 gap-3 mt-3">
        <motion.div
          custom={2} initial="hidden" animate="visible" variants={cardVariants}
          className="gradient-watering rounded-2xl p-4 min-h-[130px] flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground font-bold text-base">Sulama Zamanı</h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              {needsWater > 0
                ? `${myPlants.filter(p => p.needsWatering).map(p => p.name).join(", ")} sulanmalı`
                : "Tüm bitkiler sulandı!"}
            </p>
            <span className="inline-flex items-center gap-1 mt-2 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
              💧 Bugün
            </span>
          </div>
        </motion.div>

        <motion.div
          custom={3} initial="hidden" animate="visible" variants={cardVariants}
          className="gradient-planting rounded-2xl p-4 min-h-[130px] flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-foreground font-bold text-base">Ekim Önerisi</h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              {seasonalSuggestions[0].name} ekme zamanı
            </p>
            <span className="inline-flex items-center gap-1 mt-2 bg-accent text-accent-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
              🌿 İdeal
            </span>
          </div>
        </motion.div>
      </div>

      {/* Help Banner */}
      <motion.div
        custom={4} initial="hidden" animate="visible" variants={cardVariants}
        onClick={() => navigate("/ai-assistant")}
        className="mx-4 mt-3 gradient-help rounded-2xl p-5 cursor-pointer flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
          <Camera className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-primary-foreground font-bold text-base">
            Yardıma mı ihtiyacın var?
          </h3>
          <p className="text-primary-foreground/80 text-sm mt-0.5">
            Hemen fotoğraf çek, AI asistanım yardım etsin
          </p>
        </div>
      </motion.div>

      {/* Seasonal Suggestions */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-foreground mb-3">Bu Mevsim Ekilebilir</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {seasonalSuggestions.map((s) => (
            <div
              key={s.name}
              className="min-w-[120px] bg-card rounded-xl p-3 shadow-card border border-border flex flex-col items-center gap-1"
            >
              <span className="text-3xl">{s.emoji}</span>
              <span className="font-bold text-sm text-foreground">{s.name}</span>
              <span className="text-[10px] text-muted-foreground text-center">{s.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
