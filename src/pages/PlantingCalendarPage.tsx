import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";

type PlantCategory = "vegetable" | "fruit" | "herb";

interface CalendarPlant {
  name: Record<string, string>;
  emoji: string;
  category: PlantCategory;
  plantDays: number[]; // days of month ideal for planting (1-indexed)
  note?: Record<string, string>;
}

const monthlyPlants: Record<number, CalendarPlant[]> = {
  0: [
    { name: { tr: "Sarımsak", en: "Garlic" }, emoji: "🧄", category: "vegetable", plantDays: [1,2,3,5,8,10,15,20,25] },
    { name: { tr: "Ispanak", en: "Spinach" }, emoji: "🥬", category: "vegetable", plantDays: [3,5,7,10,12,18,22] },
  ],
  1: [
    { name: { tr: "Bezelye", en: "Pea" }, emoji: "🫛", category: "vegetable", plantDays: [5,8,12,15,20,25] },
    { name: { tr: "Marul", en: "Lettuce" }, emoji: "🥬", category: "vegetable", plantDays: [1,3,7,10,14,18,22,26] },
  ],
  2: [
    { name: { tr: "Havuç", en: "Carrot" }, emoji: "🥕", category: "vegetable", plantDays: [1,5,8,12,15,20,25] },
    { name: { tr: "Turp", en: "Radish" }, emoji: "🔴", category: "vegetable", plantDays: [2,6,10,14,18,22,26] },
    { name: { tr: "Maydanoz", en: "Parsley" }, emoji: "🌿", category: "herb", plantDays: [3,7,11,15,19,23,27] },
  ],
  3: [
    { name: { tr: "Domates", en: "Tomato" }, emoji: "🍅", category: "vegetable", plantDays: [1,2,3,6,10,15], note: { tr: "Fide dikimi başlar", en: "Seedling planting starts" } },
    { name: { tr: "Biber", en: "Pepper" }, emoji: "🌶️", category: "vegetable", plantDays: [5,10,13,15,18,22], note: { tr: "İdeal sıcaklık gerekli", en: "Ideal temperature needed" } },
    { name: { tr: "Patlıcan", en: "Eggplant" }, emoji: "🍆", category: "vegetable", plantDays: [15,18,20,22,23,25,29], note: { tr: "Nisan ortası ideal", en: "Mid-April ideal" } },
  ],
  4: [
    { name: { tr: "Kabak", en: "Squash" }, emoji: "🎃", category: "vegetable", plantDays: [1,5,8,12,15,20,25] },
    { name: { tr: "Salatalık", en: "Cucumber" }, emoji: "🥒", category: "vegetable", plantDays: [3,7,10,14,18,22,26] },
    { name: { tr: "Fasulye", en: "Bean" }, emoji: "🫘", category: "vegetable", plantDays: [2,6,10,14,18,22,26] },
  ],
  5: [
    { name: { tr: "Karpuz", en: "Watermelon" }, emoji: "🍉", category: "fruit", plantDays: [1,5,10,15] },
    { name: { tr: "Kavun", en: "Melon" }, emoji: "🍈", category: "fruit", plantDays: [1,5,10,15] },
    { name: { tr: "Fesleğen", en: "Basil" }, emoji: "🌿", category: "herb", plantDays: [1,5,8,12,15,20,25] },
  ],
  6: [
    { name: { tr: "Tere", en: "Cress" }, emoji: "🌱", category: "herb", plantDays: [1,5,10,15,20,25] },
    { name: { tr: "Roka", en: "Arugula" }, emoji: "🥗", category: "herb", plantDays: [3,8,13,18,23,28] },
  ],
  7: [
    { name: { tr: "Brokoli", en: "Broccoli" }, emoji: "🥦", category: "vegetable", plantDays: [15,18,20,22,25,28] },
    { name: { tr: "Karnabahar", en: "Cauliflower" }, emoji: "🥬", category: "vegetable", plantDays: [15,18,20,22,25,28] },
  ],
  8: [
    { name: { tr: "Lahana", en: "Cabbage" }, emoji: "🥬", category: "vegetable", plantDays: [1,5,8,12,15,20] },
    { name: { tr: "Ispanak", en: "Spinach" }, emoji: "🥬", category: "vegetable", plantDays: [5,10,15,20,25] },
  ],
  9: [
    { name: { tr: "Sarımsak", en: "Garlic" }, emoji: "🧄", category: "vegetable", plantDays: [1,5,10,15,20,25] },
    { name: { tr: "Soğan", en: "Onion" }, emoji: "🧅", category: "vegetable", plantDays: [5,10,15,20,25] },
  ],
  10: [
    { name: { tr: "Bezelye", en: "Pea" }, emoji: "🫛", category: "vegetable", plantDays: [1,5,10,15,20] },
    { name: { tr: "Bakla", en: "Fava Bean" }, emoji: "🫘", category: "vegetable", plantDays: [5,10,15,20,25] },
  ],
  11: [
    { name: { tr: "Sarımsak", en: "Garlic" }, emoji: "🧄", category: "vegetable", plantDays: [1,5,10,15] },
    { name: { tr: "Ispanak", en: "Spinach" }, emoji: "🥬", category: "vegetable", plantDays: [5,10,15,20] },
  ],
};

const monthNames = {
  tr: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const fullMonthNames = {
  tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const dayNames = {
  tr: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const PlantingCalendarPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedPlant, setSelectedPlant] = useState<CalendarPlant | null>(null);
  const lang = (i18n.language === "en" ? "en" : "tr") as "tr" | "en";

  const plants = monthlyPlants[selectedMonth] || [];

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, selectedMonth, 1);
    let startDow = firstDay.getDay() - 1; // Monday=0
    if (startDow < 0) startDow = 6;
    const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();

    const cells: { day: number | null; plants: CalendarPlant[] }[] = [];
    // Empty cells before first day
    for (let i = 0; i < startDow; i++) cells.push({ day: null, plants: [] });
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dayPlants = plants.filter(p => p.plantDays.includes(d));
      cells.push({ day: d, plants: dayPlants });
    }
    return cells;
  }, [selectedMonth, currentYear, plants]);

  const today = new Date().getDate();

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
      <div className="px-4 mt-3">
        <div className="grid grid-cols-4 gap-1.5">
          {monthNames[lang].map((month, idx) => (
            <button key={idx} onClick={() => setSelectedMonth(idx)}
              className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                idx === selectedMonth
                  ? "bg-primary text-primary-foreground"
                  : idx === currentMonth
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "bg-secondary text-secondary-foreground"
              }`}>
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 mt-4 flex flex-wrap gap-3">
        {plants.map(p => (
          <div key={p.name[lang]} className="flex items-center gap-1.5">
            <span className="text-sm">{p.emoji}</span>
            <span className="text-xs font-medium text-foreground">{p.name[lang]}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="px-4 mt-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-3 shadow-card">
          <h3 className="text-center font-bold text-foreground mb-3 text-sm">
            {fullMonthNames[lang][selectedMonth]} {t("calendar.calendarTitle")}
          </h3>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {dayNames[lang].map(d => (
              <div key={d} className="text-center text-[9px] font-bold text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((cell, i) => (
              <div key={i}
                onClick={() => { if (cell.plants.length > 0) setSelectedPlant(cell.plants[0]); }}
                className={`min-h-[52px] rounded-lg p-0.5 text-center border transition-colors ${
                  cell.day === null ? "border-transparent"
                    : cell.day === today && selectedMonth === currentMonth
                      ? "border-primary bg-primary/5"
                      : cell.plants.length > 0
                        ? "border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10"
                        : "border-border/50"
                }`}>
                {cell.day !== null && (
                  <>
                    <span className={`text-[10px] font-semibold ${
                      cell.day === today && selectedMonth === currentMonth ? "text-primary" : "text-foreground"
                    }`}>{cell.day}</span>
                    <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
                      {cell.plants.slice(0, 2).map((p, pi) => (
                        <span key={pi} className="text-[10px] leading-none">{p.emoji}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Selected plant detail */}
        <AnimatePresence>
          {selectedPlant && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="mt-3 bg-card rounded-2xl border border-primary/20 p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedPlant.emoji}</span>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{selectedPlant.name[lang]}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedPlant.category === "vegetable" ? "bg-primary/10 text-primary"
                        : selectedPlant.category === "fruit" ? "bg-accent/10 text-accent"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {t(`calendar.${selectedPlant.category === "vegetable" ? "vegetables" : selectedPlant.category === "fruit" ? "fruits" : "herbs"}`)}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedPlant(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
              </div>
              {selectedPlant.note && (
                <p className="text-xs text-muted-foreground mb-2">💡 {selectedPlant.note[lang]}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("calendar.idealDays")}: {selectedPlant.plantDays.join(", ")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Plant info cards */}
      <div className="px-4 mt-4 space-y-2">
        {plants.map((plant, i) => (
          <motion.div key={plant.name[lang]} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
            <span className="text-2xl">{plant.emoji}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-foreground">{plant.name[lang]}</h4>
              <p className="text-[10px] text-muted-foreground">
                {t("calendar.idealDays")}: {plant.plantDays.slice(0, 5).join(", ")}{plant.plantDays.length > 5 ? "..." : ""}
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              plant.category === "vegetable" ? "bg-primary/10 text-primary"
                : plant.category === "fruit" ? "bg-accent/10 text-accent"
                : "bg-emerald-100 text-emerald-700"
            }`}>
              {t(`calendar.${plant.category === "vegetable" ? "vegetables" : plant.category === "fruit" ? "fruits" : "herbs"}`)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PlantingCalendarPage;
