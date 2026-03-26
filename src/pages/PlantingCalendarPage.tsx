import { ArrowLeft, Sprout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const monthlyPlants: Record<number, { name: string; emoji: string; tip: string }[]> = {
  0: [{ name: "Sarımsak", emoji: "🧄", tip: "Soğuk aylarda ekilir" }, { name: "Ispanak", emoji: "🥬", tip: "Serin havayı sever" }],
  1: [{ name: "Bezelye", emoji: "🫛", tip: "Şubat sonu ekilebilir" }, { name: "Marul", emoji: "🥬", tip: "Erken ekim" }],
  2: [{ name: "Havuç", emoji: "🥕", tip: "Mart başı ideal" }, { name: "Turp", emoji: "🔴", tip: "30 günde hasat" }, { name: "Maydanoz", emoji: "🌿", tip: "Her mevsim ekilebilir" }],
  3: [{ name: "Domates", emoji: "🍅", tip: "Fide olarak dikin" }, { name: "Biber", emoji: "🌶️", tip: "Sıcak ortam ister" }, { name: "Patlıcan", emoji: "🍆", tip: "Nisan ortası ideal" }],
  4: [{ name: "Kabak", emoji: "🎃", tip: "Geniş alana ihtiyaç duyar" }, { name: "Salatalık", emoji: "🥒", tip: "Hızlı büyür" }, { name: "Fasulye", emoji: "🫘", tip: "Destek ile büyütün" }],
  5: [{ name: "Karpuz", emoji: "🍉", tip: "Sıcak ve güneşli" }, { name: "Kavun", emoji: "🍈", tip: "Haziran başı" }],
  6: [{ name: "Tere", emoji: "🌱", tip: "Hızlı hasat" }, { name: "Roka", emoji: "🥗", tip: "Yazın ekilebilir" }],
  7: [{ name: "Brokoli", emoji: "🥦", tip: "Ağustos sonu fide" }, { name: "Karnabahar", emoji: "🥬", tip: "Sonbahar hasadı için" }],
  8: [{ name: "Lahana", emoji: "🥬", tip: "Eylül ekim ayı" }, { name: "Ispanak", emoji: "🥬", tip: "Serin havada harika" }],
  9: [{ name: "Sarımsak", emoji: "🧄", tip: "Ekim-Kasım arası ideal" }, { name: "Soğan", emoji: "🧅", tip: "Sonbahar ekimi" }],
  10: [{ name: "Bezelye", emoji: "🫛", tip: "Kasım sonuna kadar" }, { name: "Bakla", emoji: "🫘", tip: "Kışlık ekim" }],
  11: [{ name: "Sarımsak", emoji: "🧄", tip: "Aralık ekimi mümkün" }, { name: "Ispanak", emoji: "🥬", tip: "Soğuğa dayanıklı" }],
};

const monthNames = {
  tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const PlantingCalendarPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const lang = i18n.language as "tr" | "en";
  const months = monthNames[lang] || monthNames.tr;

  const plants = monthlyPlants[selectedMonth] || [];

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("calendar.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("calendar.subtitle")}</p>
        </div>
      </div>

      {/* Month selector */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {months.map((month, idx) => (
            <button key={idx} onClick={() => setSelectedMonth(idx)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                idx === selectedMonth
                  ? "bg-primary text-primary-foreground"
                  : idx === currentMonth
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground"
              }`}>
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* Current month highlight */}
      {selectedMonth === currentMonth && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 bg-accent/10 border border-accent/20 rounded-2xl p-4">
          <p className="text-sm font-bold text-foreground">🌱 {t("calendar.currentMonth", { month: months[currentMonth] })}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("calendar.currentMonthDesc")}</p>
        </motion.div>
      )}

      {/* Plants for selected month */}
      <div className="px-4 mt-4 space-y-3">
        {plants.map((plant, i) => (
          <motion.div key={plant.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl p-4 shadow-card border border-border flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
              {plant.emoji}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">{plant.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{plant.tip}</p>
            </div>
            <Sprout className="w-5 h-5 text-primary" />
          </motion.div>
        ))}
        {plants.length === 0 && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">{t("calendar.noPlants")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantingCalendarPage;
