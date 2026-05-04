import { ArrowLeft, Droplets, Check, Undo2, Beaker, CloudRain, Sparkles, ChevronRight, ChevronLeft, Camera, Flower2, Calendar as CalendarIcon, List, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserPlants, updatePlant } from "@/lib/plantService";
import potHoled from "@/assets/pot-holed.png";
import potSolid from "@/assets/pot-solid.png";
import potTransparent from "@/assets/pot-transparent.png";
import potSelfwater from "@/assets/pot-selfwater.png";
import sizeSmall from "@/assets/size-small.png";
import sizeMedium from "@/assets/size-medium.png";
import sizeLarge from "@/assets/size-large.png";
import sizeXLarge from "@/assets/size-xlarge.png";
import {
  fetchUserWateringEvents,
  completeWateringEvent,
  uncompleteWateringEvent,
  generateWateringPlan,
  frequencyToDays,
} from "@/lib/wateringService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const waterAmounts: Record<string, string> = {
  domates: "250 ml", tomato: "250 ml", biber: "200 ml", pepper: "200 ml",
  patlıcan: "300 ml", eggplant: "300 ml", salatalık: "200 ml", cucumber: "200 ml",
  nane: "100 ml", mint: "100 ml", fesleğen: "100 ml", basil: "100 ml",
  maydanoz: "100 ml", parsley: "100 ml", marul: "150 ml", lettuce: "150 ml",
};

function getWaterAmount(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, amount] of Object.entries(waterAmounts)) {
    if (lower.includes(key)) return amount;
  }
  return "150 ml";
}

interface WeatherTip {
  icon: React.ElementType;
  message: string;
}

const AI_WATER_SCAN_KEY = "gardenPotWaterScanDate";
const AI_WATER_SCAN_COUNT = "gardenPotWaterScanCount";

function canFreeWaterScan(): boolean {
  const lastDate = localStorage.getItem(AI_WATER_SCAN_KEY);
  const today = new Date().toDateString();
  if (lastDate !== today) return true;
  return parseInt(localStorage.getItem(AI_WATER_SCAN_COUNT) || "0") < 1;
}

function recordWaterScan() {
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem(AI_WATER_SCAN_KEY);
  if (lastDate !== today) {
    localStorage.setItem(AI_WATER_SCAN_KEY, today);
    localStorage.setItem(AI_WATER_SCAN_COUNT, "1");
  } else {
    const count = parseInt(localStorage.getItem(AI_WATER_SCAN_COUNT) || "0");
    localStorage.setItem(AI_WATER_SCAN_COUNT, String(count + 1));
  }
}

type AnalysisMode = "none" | "choose" | "registered" | "new_photo" | "new_manual";
// New order: type → pot (size) → potType → amount → frequency
type ManualStep = "type" | "pot" | "potType" | "amount" | "frequency" | "analyzing";

const potSizes = [
  { key: "small", tr: "Küçük (10-15 cm)", en: "Small (10-15 cm)", img: sizeSmall, hint: { tr: "Kahve fincanı boyutu", en: "Coffee cup size" } },
  { key: "medium", tr: "Orta (15-25 cm)", en: "Medium (15-25 cm)", img: sizeMedium, hint: { tr: "Salata kasesi boyutu", en: "Salad bowl size" } },
  { key: "large", tr: "Büyük (25-40 cm)", en: "Large (25-40 cm)", img: sizeLarge, hint: { tr: "Kova boyutu", en: "Bucket size" } },
  { key: "xlarge", tr: "Çok Büyük (40+ cm)", en: "Extra Large (40+ cm)", img: sizeXLarge, hint: { tr: "Çamaşır sepeti boyutu", en: "Laundry basket size" } },
];

const potTypes = [
  { key: "holed", img: potHoled, tr: "Delikli Saksı", en: "Drainage Pot", desc: { tr: "Alt kısımda delikler var", en: "Has holes at the bottom" } },
  { key: "solid", img: potSolid, tr: "Deliksiz Saksı", en: "Solid Pot", desc: { tr: "Delik yok, dikkatli sulama", en: "No holes, careful watering" } },
  { key: "transparent", img: potTransparent, tr: "Şeffaf Saksı", en: "Transparent Pot", desc: { tr: "Kök gelişimini izleyin", en: "Monitor root growth" } },
  { key: "selfwater", img: potSelfwater, tr: "Kendinden Sulu", en: "Self-Watering", desc: { tr: "Hazne ile otomatik sulama", en: "Auto-watering reservoir" } },
];

const frequencyOptions = [
  { key: "new", tr: "Yeni aldım (henüz sulamadım)", en: "Just bought (not watered yet)" },
  { key: "daily", tr: "Her gün", en: "Every day" },
  { key: "2days", tr: "2 günde bir", en: "Every 2 days" },
  { key: "3days", tr: "3 günde bir", en: "Every 3 days" },
  { key: "weekly", tr: "Haftada bir", en: "Once a week" },
  { key: "biweekly", tr: "2 haftada bir", en: "Every 2 weeks" },
];

// Comprehensive plant name suggestions used for autocomplete + validation
const plantSuggestions = [
  "Domates","Tomato","Biber","Pepper","Patlıcan","Eggplant","Salatalık","Cucumber",
  "Kabak","Squash","Karpuz","Watermelon","Kavun","Melon","Fasulye","Bean","Bezelye","Pea",
  "Nane","Mint","Fesleğen","Basil","Maydanoz","Parsley","Marul","Lettuce","Kekik","Thyme",
  "Roka","Arugula","Ispanak","Spinach","Havuç","Carrot","Turp","Radish","Brokoli","Broccoli",
  "Sardunya","Geranium","Menekşe","Violet","Gül","Rose","Kaktüs","Cactus","Sukulent","Succulent",
  "Orkide","Orchid","Papatya","Daisy","Lavanta","Lavender","Biberiye","Rosemary","Aloe Vera",
  "Monstera","Ficus","Filodendron","Philodendron","Yucca","Palmiye","Palm","Çilek","Strawberry",
  "Üzüm","Grape","Limon","Lemon","Portakal","Orange","Elma","Apple","Kiraz","Cherry",
  "Sümbül","Hyacinth","Lale","Tulip","Zambak","Lily","Begonya","Begonia","Petunya","Petunia",
];

function isValidPlantName(s: string): boolean {
  const trimmed = s.trim().toLowerCase();
  if (trimmed.length < 2) return false;
  if (!/^[a-zA-ZçğıöşüÇĞİÖŞÜ\s-]+$/.test(trimmed)) return false;
  return true;
}

// Returns true only if the entered text matches one of the known plants
function isKnownPlantName(s: string): boolean {
  const trimmed = s.trim().toLowerCase();
  return plantSuggestions.some(p => p.toLowerCase() === trimmed);
}

const amountOptions = [
  { key: "50ml", tr: "50 ml", en: "50 ml", emoji: "🥄", hint: { tr: "~3 yemek kaşığı", en: "~3 tablespoons" } },
  { key: "100ml", tr: "100 ml", en: "100 ml", emoji: "🥃", hint: { tr: "Yarım çay bardağı", en: "Half a tea glass" } },
  { key: "200ml", tr: "200 ml", en: "200 ml", emoji: "☕", hint: { tr: "Bir çay bardağı", en: "One tea glass" } },
  { key: "300ml", tr: "300 ml", en: "300 ml", emoji: "🥛", hint: { tr: "Bir su bardağı", en: "One water glass" } },
  { key: "500ml", tr: "500 ml", en: "500 ml", emoji: "🫗", hint: { tr: "Küçük şişe suyu", en: "Small water bottle" } },
];

const WateringPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [recentlyWatered, setRecentlyWatered] = useState<string[]>([]);
  const [weatherTip, setWeatherTip] = useState<WeatherTip | null>(null);
  const [aiScanning, setAiScanning] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const isPremium = false;

  // AI analysis flow
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("none");
  
  const [manualStep, setManualStep] = useState<ManualStep>("type");
  const [manualData, setManualData] = useState({ plantType: "", potSize: "", potType: "", frequency: "", amount: "" });
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Calendar navigation state
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  // Fetch watering events for the visible month
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0, 23, 59, 59);
  const { data: events = [] } = useQuery({
    queryKey: ["watering_events", user?.id, viewMonth.getFullYear(), viewMonth.getMonth()],
    queryFn: () => fetchUserWateringEvents(user!.id, monthStart, monthEnd),
    enabled: !!user,
  });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        const resp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=temperature_2m,weather_code`
        );
        const data = await resp.json();
        const temp = data.current?.temperature_2m ?? 22;
        const code = data.current?.weather_code ?? 0;
        if (temp > 32) setWeatherTip({ icon: CloudRain, message: t("watering.hotTip") });
        else if ([61, 63, 65, 80, 81, 82].includes(code)) setWeatherTip({ icon: CloudRain, message: t("watering.rainTip") });
      } catch {}
    };
    fetchWeather();
  }, [t]);

  const wateringPlants = plants.filter(p => p.needs_watering && !recentlyWatered.includes(p.id));
  const wateredPlants = [
    ...plants.filter(p => recentlyWatered.includes(p.id)),
    ...plants.filter(p => !p.needs_watering && !recentlyWatered.includes(p.id)),
  ];

  const handleWater = async (id: string) => {
    if (!user) return;
    try {
      const plant = plants.find(p => p.id === id);
      const intervalDays = plant?.watering_interval_days ?? frequencyToDays(plant?.water_frequency || "");

      // Find an existing scheduled event for today/past, else create a completed event
      const now = new Date();
      const todayEvent = events.find(e =>
        e.plant_id === id && e.status === "scheduled" &&
        new Date(e.scheduled_at) <= now
      );

      if (todayEvent) {
        await completeWateringEvent(todayEvent.id);
      } else {
        // Insert a completed event right now
        await supabase.from("watering_events").insert({
          user_id: user.id,
          plant_id: id,
          scheduled_at: now.toISOString(),
          completed_at: now.toISOString(),
          status: "completed",
          amount_ml: plant?.watering_amount_ml ?? null,
        });
        // Make sure plant has a forward-looking plan
        const hasFuture = events.some(e =>
          e.plant_id === id && e.status === "scheduled" && new Date(e.scheduled_at) > now
        );
        if (!hasFuture) {
          await generateWateringPlan({
            userId: user.id,
            plantId: id,
            intervalDays,
            amountMl: plant?.watering_amount_ml ?? undefined,
            startDate: now,
            occurrences: 12,
          });
        } else {
          await updatePlant(id, { last_watered_at: now.toISOString(), needs_watering: false });
        }
      }

      setRecentlyWatered(prev => [...prev, id]);
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["watering_events"] });
      toast({ title: "💧", description: t("watering.watered") });
    } catch (e: any) {
      toast({ title: "❌", description: e.message, variant: "destructive" });
    }
  };

  const handleUndo = async (id: string) => {
    if (!user) return;
    try {
      // Find latest completed event for this plant today
      const { data: latest } = await supabase
        .from("watering_events")
        .select("*")
        .eq("plant_id", id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1);
      if (latest && latest[0]) {
        await uncompleteWateringEvent(latest[0].id);
      }
      await updatePlant(id, { needs_watering: true });
      setRecentlyWatered(prev => prev.filter(pid => pid !== id));
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["watering_events"] });
      toast({ title: "↩️", description: t("watering.undone") });
    } catch (e: any) {
      toast({ title: "❌", description: e.message, variant: "destructive" });
    }
  };

  const runAiAnalysis = async (prompt: string, imageBase64?: string) => {
    if (!isPremium && !canFreeWaterScan()) {
      toast({ title: "👑", description: t("watering.dailyLimitReached") });
      return;
    }
    setAiScanning(true);
    setAiResult(null);
    try {
      const langInstr = i18n.language === "tr"
        ? "Yanıtını TAMAMEN Türkçe ver."
        : "Respond entirely in English.";

      const messages: any[] = [{ role: "user", content: prompt + " " + langInstr }];

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plant-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages,
          mode: imageBase64 ? "disease" : "chat",
          imageBase64: imageBase64 || undefined,
          lang: i18n.language,
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("AI error");

      const rdr = resp.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let buf = "";
      while (true) {
        const { done, value } = await rdr.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const js = line.slice(6).trim();
          if (js === "[DONE]") continue;
          try {
            const p = JSON.parse(js);
            const c = p.choices?.[0]?.delta?.content;
            if (c) result += c;
          } catch {}
        }
      }
      setAiResult(result || t("watering.aiNoResult"));
      recordWaterScan();
    } catch (e: any) {
      toast({ title: "❌", description: e.message, variant: "destructive" });
    }
    setAiScanning(false);
    setAnalysisMode("none");
  };

  const handleRegisteredPlantAnalysis = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (!plant) return;
    const prompt = `Analyze watering needs for this plant:
- Name: ${plant.name}
- Water frequency: ${plant.water_frequency}
- Soil type: ${plant.soil_type}
- Placement: ${plant.placement}
- Humidity: ${plant.humidity}
- Temperature: ${plant.temperature}
Provide: ideal watering amount (ml), optimal schedule, tips for current season. Be concise and give a practical watering calendar.`;
    runAiAnalysis(prompt);
  };

  const handlePhotoAnalysis = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      runAiAnalysis(
        "Analyze this plant for watering needs. Based on the plant type, pot size, soil condition, and current state, recommend: how much water (in ml), how often to water, and provide a practical watering schedule.",
        base64
      );
    };
    reader.readAsDataURL(file);
  };

  const handleManualAnalysis = () => {
    setManualStep("analyzing");
    const prompt = `Create a detailed watering analysis and schedule for:
- Plant type: ${manualData.plantType}
- Pot size: ${manualData.potSize}
- Pot type: ${manualData.potType}
- Current watering frequency: ${manualData.frequency}
- Current watering amount: ${manualData.amount}
Provide: recommended watering amount (ml), optimal schedule, seasonal adjustments, and practical tips based on pot type (drainage affects watering). Be concise.`;
    runAiAnalysis(prompt);
  };

  const isTr = i18n.language === "tr";

  // Calendar view helpers (use viewMonth, not today)
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const isCurrentMonth = viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() === today.getMonth();

  // Group events by day for the visible month
  const eventsByDay = new Map<number, typeof events>();
  events.forEach(ev => {
    const d = new Date(ev.scheduled_at);
    if (d.getMonth() === viewMonth.getMonth() && d.getFullYear() === viewMonth.getFullYear()) {
      const day = d.getDate();
      const arr = eventsByDay.get(day) || [];
      arr.push(ev);
      eventsByDay.set(day, arr);
    }
  });

  const selectedDayEvents = selectedDay ? eventsByDay.get(selectedDay) || [] : [];

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { if (e.target.files?.[0]) handlePhotoAnalysis(e.target.files[0]); }} />

      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{t("watering.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("watering.subtitle", { count: wateringPlants.length })}</p>
        </div>
      </div>

      {/* AI Water Analysis - Choose mode */}
      <div className="px-4 mt-3">
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => setAnalysisMode(analysisMode === "choose" ? "none" : "choose")}
          className="w-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center">
            {aiScanning ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-blue-500" />
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{t("watering.aiAnalysis")}</span>
              {!isPremium && (
                <span className="text-[10px] font-medium bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                  {canFreeWaterScan() ? t("watering.freeScanAvailable") : t("watering.dailyLimitReached")}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">{t("watering.aiAnalysisDesc")}</p>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${analysisMode !== "none" ? "rotate-90" : ""}`} />
        </motion.button>

        <AnimatePresence>
          {analysisMode === "choose" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2 overflow-hidden">
              <button onClick={() => setAnalysisMode("registered")}
                className="w-full bg-card border border-border rounded-xl p-3 flex items-center gap-3 text-left">
                <Flower2 className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground">{isTr ? "Kayıtlı Bitkilerim" : "My Registered Plants"}</span>
                  <p className="text-[11px] text-muted-foreground">{isTr ? "Bitki bilgilerini kullanarak analiz yap" : "Analyze using plant info"}</p>
                </div>
              </button>
              <button onClick={() => { setAnalysisMode("new_photo"); }}
                className="w-full bg-card border border-border rounded-xl p-3 flex items-center gap-3 text-left">
                <Camera className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground">{isTr ? "Fotoğraf ile Analiz" : "Analyze from Photo"}</span>
                  <p className="text-[11px] text-muted-foreground">{isTr ? "Fotoğraf çekerek otomatik analiz" : "Auto-analyze from photo"}</p>
                </div>
              </button>
              <button onClick={() => { setAnalysisMode("new_manual"); setManualStep("type"); setManualData({ plantType: "", potSize: "", potType: "", frequency: "", amount: "" }); }}
                className="w-full bg-card border border-border rounded-xl p-3 flex items-center gap-3 text-left">
                <Beaker className="w-5 h-5 text-amber-500" />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground">{isTr ? "Manuel Giriş" : "Manual Entry"}</span>
                  <p className="text-[11px] text-muted-foreground">{isTr ? "Adım adım bilgi girerek daha doğru sonuç al" : "Step-by-step entry for more accurate results"}</p>
                </div>
              </button>
            </motion.div>
          )}

          {analysisMode === "registered" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-1.5 overflow-hidden">
              <p className="text-xs font-medium text-muted-foreground mb-1">{isTr ? "Bir bitki seçin:" : "Select a plant:"}</p>
              {plants.map(p => (
                <button key={p.id} onClick={() => handleRegisteredPlantAnalysis(p.id)}
                  className="w-full bg-card border border-border rounded-xl p-3 flex items-center gap-3 text-left">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Droplets className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-foreground">{p.name}</span>
                    <p className="text-[11px] text-muted-foreground">{p.water_frequency}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
              <button onClick={() => setAnalysisMode("choose")} className="text-xs text-primary font-medium mt-1">
                ← {isTr ? "Geri" : "Back"}
              </button>
            </motion.div>
          )}

          {analysisMode === "new_photo" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mt-2 overflow-hidden">
              <div className="bg-card border border-border rounded-xl p-4 text-center space-y-3">
                <Camera className="w-10 h-10 text-blue-500 mx-auto" />
                <p className="text-sm text-foreground">{isTr ? "Bitkinin fotoğrafını çekin" : "Take a photo of the plant"}</p>
                <button onClick={() => cameraRef.current?.click()}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold">
                  {isTr ? "Fotoğraf Çek" : "Take Photo"}
                </button>
              </div>
              <button onClick={() => setAnalysisMode("choose")} className="text-xs text-primary font-medium mt-2">
                ← {isTr ? "Geri" : "Back"}
              </button>
            </motion.div>
          )}

          {analysisMode === "new_manual" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mt-2 overflow-hidden">
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                {/* Step indicator — new order: type → pot → potType → amount → frequency */}
                <div className="flex items-center gap-1 mb-2">
                  {(["type", "pot", "potType", "amount", "frequency"] as const).map((s, i) => (
                    <div key={s} className={`flex-1 h-1 rounded-full ${
                      (["type", "pot", "potType", "amount", "frequency"] as const).indexOf(manualStep as any) >= i ? "bg-primary" : "bg-secondary"
                    }`} />
                  ))}
                </div>

                {manualStep === "type" && (() => {
                  const q = manualData.plantType.trim().toLowerCase();
                  const matches = q.length >= 1
                    ? plantSuggestions.filter(p => p.toLowerCase().includes(q)).slice(0, 6)
                    : [];
                  return (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{isTr ? "Bitki Türü" : "Plant Type"}</p>
                      <div className="relative">
                        <input
                          value={manualData.plantType}
                          onChange={e => { setManualData({ ...manualData, plantType: e.target.value }); setShowSuggestions(true); }}
                          onFocus={() => setShowSuggestions(true)}
                          placeholder={isTr ? "Ör: Domates, Fesleğen..." : "e.g. Tomato, Basil..."}
                          className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                        {showSuggestions && matches.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                            {matches.map(m => (
                              <button key={m} onClick={() => { setManualData({ ...manualData, plantType: m }); setShowSuggestions(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 text-foreground">
                                🌿 {m}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        💡 {isTr ? "Listeden seçin veya tam ad yazın. Bilinmeyen adlar kabul edilmez." : "Pick from the list or type a full name. Unknown names are rejected."}
                      </p>
                      <button onClick={() => {
                        if (!isValidPlantName(manualData.plantType)) {
                          toast({ title: "❌", description: isTr ? "Lütfen geçerli bir bitki adı girin" : "Please enter a valid plant name", variant: "destructive" });
                          return;
                        }
                        if (!isKnownPlantName(manualData.plantType)) {
                          toast({ title: "❌", description: isTr ? "Bu bitki listemizde yok. Lütfen önerilerden birini seçin." : "This plant isn't in our list. Please pick one of the suggestions.", variant: "destructive" });
                          return;
                        }
                        setShowSuggestions(false);
                        setManualStep("pot");
                      }} disabled={!manualData.plantType}
                        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                        {isTr ? "Devam" : "Continue"}
                      </button>
                    </div>
                  );
                })()}

                {manualStep === "pot" && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{isTr ? "Saksı Boyutu" : "Pot Size"}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {potSizes.map(ps => (
                        <button key={ps.key} onClick={() => { setManualData({ ...manualData, potSize: isTr ? ps.tr : ps.en }); setManualStep("potType"); }}
                          className="bg-secondary rounded-2xl p-3 text-center hover:bg-primary/10 transition-colors flex flex-col items-center gap-1">
                          <img src={ps.img} alt="" loading="lazy" className="w-16 h-16 object-contain" />
                          <span className="text-xs font-bold text-foreground leading-tight">{isTr ? ps.tr : ps.en}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight">{isTr ? ps.hint.tr : ps.hint.en}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setManualStep("type")} className="text-xs text-primary font-medium">
                      ← {isTr ? "Geri" : "Back"}
                    </button>
                  </div>
                )}

                {manualStep === "potType" && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{isTr ? "Saksı Tipi" : "Pot Type"}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {potTypes.map(pt => (
                        <button key={pt.key} onClick={() => { setManualData({ ...manualData, potType: isTr ? pt.tr : pt.en }); setManualStep("amount"); }}
                          className="bg-secondary rounded-2xl p-3 text-center hover:bg-primary/10 transition-colors flex flex-col items-center gap-1">
                          <img src={pt.img} alt="" loading="lazy" className="w-16 h-16 object-contain" />
                          <span className="text-xs font-bold text-foreground leading-tight">{isTr ? pt.tr : pt.en}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight">{isTr ? pt.desc.tr : pt.desc.en}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setManualStep("pot")} className="text-xs text-primary font-medium">
                      ← {isTr ? "Geri" : "Back"}
                    </button>
                  </div>
                )}

                {manualStep === "amount" && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{isTr ? "Sulama Miktarı" : "Watering Amount"}</p>
                    <div className="space-y-1.5">
                      {amountOptions.map(ao => (
                        <button key={ao.key} onClick={() => { setManualData({ ...manualData, amount: isTr ? ao.tr : ao.en }); setManualStep("frequency"); }}
                          className="w-full bg-secondary rounded-xl p-3 flex items-center gap-3 hover:bg-primary/10 transition-colors">
                          <span className="text-xl">{ao.emoji}</span>
                          <div className="flex-1 text-left">
                            <span className="text-sm font-semibold text-foreground">{isTr ? ao.tr : ao.en}</span>
                            <p className="text-[10px] text-muted-foreground">{isTr ? ao.hint.tr : ao.hint.en}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setManualStep("potType")} className="text-xs text-primary font-medium">
                      ← {isTr ? "Geri" : "Back"}
                    </button>
                  </div>
                )}

                {manualStep === "frequency" && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{isTr ? "Mevcut Sulama Sıklığı" : "Current Watering Frequency"}</p>
                    <div className="space-y-1.5">
                      {frequencyOptions.map(fo => (
                        <button key={fo.key} onClick={() => { setManualData({ ...manualData, frequency: isTr ? fo.tr : fo.en }); }}
                          className={`w-full rounded-xl p-3 text-sm text-foreground text-left transition-colors ${
                            manualData.frequency === (isTr ? fo.tr : fo.en) ? "bg-primary/10 border-2 border-primary" : "bg-secondary hover:bg-primary/5"
                          }`}>
                          {isTr ? fo.tr : fo.en}
                        </button>
                      ))}
                    </div>
                    {manualData.frequency && (
                      <button onClick={handleManualAnalysis}
                        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold mt-2">
                        {isTr ? "Analiz Et" : "Analyze"}
                      </button>
                    )}
                    <button onClick={() => setManualStep("amount")} className="text-xs text-primary font-medium">
                      ← {isTr ? "Geri" : "Back"}
                    </button>
                  </div>
                )}

                {manualStep === "analyzing" && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-foreground">{isTr ? "AI analiz ediyor..." : "AI analyzing..."}</p>
                  </div>
                )}
              </div>
              <button onClick={() => setAnalysisMode("choose")} className="text-xs text-primary font-medium mt-2">
                ← {isTr ? "Geri" : "Back"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {aiResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-card rounded-2xl p-4 border border-blue-500/20">
            <p className="text-sm text-foreground whitespace-pre-wrap">{aiResult}</p>
          </motion.div>
        )}
      </div>

      {weatherTip && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-200/50 flex items-center gap-3">
          <weatherTip.icon className="w-5 h-5 text-blue-500 shrink-0" />
          <p className="text-xs text-foreground">{weatherTip.message}</p>
        </motion.div>
      )}

      {/* Calendar View */}
      {true && (
        <div className="px-4 mt-4">
          <div className="bg-card rounded-2xl border border-border p-3">
            <h3 className="text-sm font-bold text-foreground mb-2">
              {today.toLocaleDateString(isTr ? "tr-TR" : "en-US", { month: "long", year: "numeric" })}
            </h3>
            <div className="grid grid-cols-7 gap-1 text-center">
              {(isTr ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]).map(d => (
                <span key={d} className="text-[10px] font-medium text-muted-foreground">{d}</span>
              ))}
              {Array.from({ length: (firstDayOfWeek + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = day === today.getDate();
                const isPast = day < today.getDate();
                const dayEvents = eventsByDay.get(day) || [];
                const completedCount = dayEvents.filter(e => e.status === "completed").length;
                const scheduledCount = dayEvents.filter(e => e.status === "scheduled").length;
                return (
                  <div key={day}
                    title={dayEvents.map(e => {
                      const p = plants.find(pl => pl.id === e.plant_id);
                      return `${p?.name || ""} (${e.status})`;
                    }).join(", ")}
                    className={`relative w-full aspect-square flex items-center justify-center rounded-lg text-xs ${
                      isToday ? "bg-primary text-primary-foreground font-bold" : "text-foreground"
                    }`}>
                    {day}
                    <div className="absolute bottom-0.5 flex gap-0.5">
                      {completedCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />}
                      {scheduledCount > 0 && (
                        <div className={`w-1.5 h-1.5 rounded-full ${isPast ? "bg-destructive/50" : isToday ? "bg-blue-500" : "bg-blue-300"}`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary/60" /> {isTr ? "Tamamlandı" : "Completed"}</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> {isTr ? "Bugün" : "Today"}</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-300" /> {isTr ? "Planlanan" : "Planned"}</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive/50" /> {isTr ? "Kaçırıldı" : "Missed"}</div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {wateringPlants.length === 0 && wateredPlants.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Droplets className="w-10 h-10 text-primary/40" />
          </div>
          <p className="text-muted-foreground font-medium">{t("watering.allDone")}</p>
        </div>
      ) : (
        <>
          {wateringPlants.length > 0 && (
            <div className="px-4 mt-4 space-y-2">
              <AnimatePresence>
                {wateringPlants.map((plant, i) => {
                  const waterAmount = getWaterAmount(plant.name);
                  return (
                    <motion.div key={plant.id}
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }} transition={{ delay: i * 0.05 }}
                      className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
                      {plant.photo_url ? (
                        <img src={plant.photo_url} alt={plant.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Droplets className="w-5 h-5 text-blue-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground">{plant.name}</h3>
                        <p className="text-[11px] text-muted-foreground">{plant.water_frequency || t("watering.needsWater")}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Beaker className="w-3 h-3 text-blue-400" />
                          <span className="text-[10px] font-medium text-blue-500">~{waterAmount}</span>
                        </div>
                      </div>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleWater(plant.id)}
                        className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
                        <Check className="w-5 h-5 text-white" />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {wateredPlants.length > 0 && (
            <div className="px-4 mt-5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t("watering.alreadyWatered")}</h3>
              <div className="space-y-1.5">
                {wateredPlants.map(plant => (
                  <div key={plant.id} className="bg-card/60 rounded-xl p-3 border border-border/40 flex items-center gap-3">
                    {plant.photo_url ? (
                      <img src={plant.photo_url} alt={plant.name} className="w-9 h-9 rounded-lg object-cover opacity-60" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center opacity-60">
                        <Droplets className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground flex-1">{plant.name}</span>
                    <Check className="w-4 h-4 text-primary" />
                    {recentlyWatered.includes(plant.id) && (
                      <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        whileTap={{ scale: 0.9 }} onClick={() => handleUndo(plant.id)}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        <Undo2 className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WateringPage;
