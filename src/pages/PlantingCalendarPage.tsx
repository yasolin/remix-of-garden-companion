import { ArrowLeft, Sprout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState } from "react";

type PlantCategory = "vegetable" | "fruit" | "herb";

interface CalendarPlant {
  name: Record<string, string>;
  emoji: string;
  tip: Record<string, string>;
  category: PlantCategory;
}

const monthlyPlants: Record<number, CalendarPlant[]> = {
  0: [
    { name: { tr: "Sarımsak", en: "Garlic" }, emoji: "🧄", tip: { tr: "Soğuk aylarda ekilir", en: "Plant in cold months" }, category: "vegetable" },
    { name: { tr: "Ispanak", en: "Spinach" }, emoji: "🥬", tip: { tr: "Serin havayı sever", en: "Loves cool weather" }, category: "vegetable" },
  ],
  1: [
    { name: { tr: "Bezelye", en: "Pea" }, emoji: "🫛", tip: { tr: "Şubat sonu ekilebilir", en: "Can be sown late February" }, category: "vegetable" },
    { name: { tr: "Marul", en: "Lettuce" }, emoji: "🥬", tip: { tr: "Erken ekim", en: "Early sowing" }, category: "vegetable" },
  ],
  2: [
    { name: { tr: "Havuç", en: "Carrot" }, emoji: "🥕", tip: { tr: "Mart başı ideal", en: "Early March is ideal" }, category: "vegetable" },
    { name: { tr: "Turp", en: "Radish" }, emoji: "🔴", tip: { tr: "30 günde hasat", en: "Harvest in 30 days" }, category: "vegetable" },
    { name: { tr: "Maydanoz", en: "Parsley" }, emoji: "🌿", tip: { tr: "Her mevsim ekilebilir", en: "Can be planted any season" }, category: "herb" },
  ],
  3: [
    { name: { tr: "Domates", en: "Tomato" }, emoji: "🍅", tip: { tr: "Fide olarak dikin", en: "Plant as seedlings" }, category: "vegetable" },
    { name: { tr: "Biber", en: "Pepper" }, emoji: "🌶️", tip: { tr: "Sıcak ortam ister", en: "Needs warm environment" }, category: "vegetable" },
    { name: { tr: "Patlıcan", en: "Eggplant" }, emoji: "🍆", tip: { tr: "Nisan ortası ideal", en: "Mid-April is ideal" }, category: "vegetable" },
  ],
  4: [
    { name: { tr: "Kabak", en: "Squash" }, emoji: "🎃", tip: { tr: "Geniş alana ihtiyaç duyar", en: "Needs wide space" }, category: "vegetable" },
    { name: { tr: "Salatalık", en: "Cucumber" }, emoji: "🥒", tip: { tr: "Hızlı büyür", en: "Grows fast" }, category: "vegetable" },
    { name: { tr: "Fasulye", en: "Bean" }, emoji: "🫘", tip: { tr: "Destek ile büyütün", en: "Grow with support" }, category: "vegetable" },
  ],
  5: [
    { name: { tr: "Karpuz", en: "Watermelon" }, emoji: "🍉", tip: { tr: "Sıcak ve güneşli", en: "Hot and sunny" }, category: "fruit" },
    { name: { tr: "Kavun", en: "Melon" }, emoji: "🍈", tip: { tr: "Haziran başı", en: "Early June" }, category: "fruit" },
    { name: { tr: "Fesleğen", en: "Basil" }, emoji: "🌿", tip: { tr: "Sıcak havayı sever", en: "Loves warm weather" }, category: "herb" },
  ],
  6: [
    { name: { tr: "Tere", en: "Cress" }, emoji: "🌱", tip: { tr: "Hızlı hasat", en: "Quick harvest" }, category: "herb" },
    { name: { tr: "Roka", en: "Arugula" }, emoji: "🥗", tip: { tr: "Yazın ekilebilir", en: "Can be sown in summer" }, category: "herb" },
  ],
  7: [
    { name: { tr: "Brokoli", en: "Broccoli" }, emoji: "🥦", tip: { tr: "Ağustos sonu fide", en: "Late August seedlings" }, category: "vegetable" },
    { name: { tr: "Karnabahar", en: "Cauliflower" }, emoji: "🥬", tip: { tr: "Sonbahar hasadı için", en: "For autumn harvest" }, category: "vegetable" },
  ],
  8: [
    { name: { tr: "Lahana", en: "Cabbage" }, emoji: "🥬", tip: { tr: "Eylül ekim ayı", en: "September planting month" }, category: "vegetable" },
    { name: { tr: "Ispanak", en: "Spinach" }, emoji: "🥬", tip: { tr: "Serin havada harika", en: "Great in cool weather" }, category: "vegetable" },
  ],
  9: [
    { name: { tr: "Sarımsak", en: "Garlic" }, emoji: "🧄", tip: { tr: "Ekim-Kasım arası ideal", en: "October-November is ideal" }, category: "vegetable" },
    { name: { tr: "Soğan", en: "Onion" }, emoji: "🧅", tip: { tr: "Sonbahar ekimi", en: "Autumn planting" }, category: "vegetable" },
  ],
  10: [
    { name: { tr: "Bezelye", en: "Pea" }, emoji: "🫛", tip: { tr: "Kasım sonuna kadar", en: "Until end of November" }, category: "vegetable" },
    { name: { tr: "Bakla", en: "Fava Bean" }, emoji: "🫘", tip: { tr: "Kışlık ekim", en: "Winter planting" }, category: "vegetable" },
  ],
  11: [
    { name: { tr: "Sarımsak", en: "Garlic" }, emoji: "🧄", tip: { tr: "Aralık ekimi mümkün", en: "December planting possible" }, category: "vegetable" },
    { name: { tr: "Ispanak", en: "Spinach" }, emoji: "🥬", tip: { tr: "Soğuğa dayanıklı", en: "Cold resistant" }, category: "vegetable" },
  ],
};

const monthNames = {
  tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const categoryColors: Record<PlantCategory, string> = {
  vegetable: "bg-primary/10 text-primary",
  fruit: "bg-accent/10 text-accent",
  herb: "bg-emerald-100 text-emerald-700",
};

const PlantingCalendarPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const lang = (i18n.language === "en" ? "en" : "tr") as "tr" | "en";
  const months = monthNames[lang];

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

      {/* Calendar grid */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-4 gap-2">
          {months.map((month, idx) => (
            <button key={idx} onClick={() => setSelectedMonth(idx)}
              className={`py-2.5 rounded-xl text-xs font-bold transition-colors ${
                idx === selectedMonth
                  ? "bg-primary text-primary-foreground"
                  : idx === currentMonth
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "bg-secondary text-secondary-foreground"
              }`}>
              {month.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Current month highlight */}
      {selectedMonth === currentMonth && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 bg-primary/5 border border-primary/15 rounded-2xl p-4">
          <p className="text-sm font-bold text-foreground">🌱 {t("calendar.currentMonth", { month: months[currentMonth] })}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("calendar.currentMonthDesc")}</p>
        </motion.div>
      )}

      {/* Plants for selected month */}
      <div className="px-4 mt-4 space-y-3">
        {plants.map((plant, i) => (
          <motion.div key={plant.name[lang]} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl p-4 shadow-card border border-border flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
              {plant.emoji}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">{plant.name[lang]}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{plant.tip[lang]}</p>
              <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryColors[plant.category]}`}>
                {t(`calendar.${plant.category === "vegetable" ? "vegetables" : plant.category === "fruit" ? "fruits" : "herbs"}`)}
              </span>
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
