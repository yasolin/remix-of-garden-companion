import { ArrowLeft, Droplets, Check, Undo2, Beaker, CloudRain, Sparkles, ChevronRight, Camera, Flower2, Calendar as CalendarIcon, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserPlants, updatePlant } from "@/lib/plantService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";

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
type ManualStep = "type" | "pot" | "frequency" | "amount" | "analyzing";

const potSizes = [
  { key: "small", tr: "Küçük (10-15 cm)", en: "Small (10-15 cm)" },
  { key: "medium", tr: "Orta (15-25 cm)", en: "Medium (15-25 cm)" },
  { key: "large", tr: "Büyük (25-40 cm)", en: "Large (25-40 cm)" },
  { key: "xlarge", tr: "Çok Büyük (40+ cm)", en: "Extra Large (40+ cm)" },
];

const frequencyOptions = [
  { key: "daily", tr: "Her gün", en: "Every day" },
  { key: "2days", tr: "2 günde bir", en: "Every 2 days" },
  { key: "3days", tr: "3 günde bir", en: "Every 3 days" },
  { key: "weekly", tr: "Haftada bir", en: "Once a week" },
  { key: "biweekly", tr: "2 haftada bir", en: "Every 2 weeks" },
];

const amountOptions = [
  { key: "50ml", tr: "50 ml", en: "50 ml" },
  { key: "100ml", tr: "100 ml", en: "100 ml" },
  { key: "200ml", tr: "200 ml", en: "200 ml" },
  { key: "300ml", tr: "300 ml", en: "300 ml" },
  { key: "500ml", tr: "500 ml", en: "500 ml" },
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
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [manualStep, setManualStep] = useState<ManualStep>("type");
  const [manualData, setManualData] = useState({ plantType: "", potSize: "", frequency: "", amount: "" });

  // View mode: list or calendar
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
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
    try {
      await updatePlant(id, { needs_watering: false });
      setRecentlyWatered(prev => [...prev, id]);
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      toast({ title: "💧", description: t("watering.watered") });
    } catch (e: any) {
      toast({ title: "❌", description: e.message, variant: "destructive" });
    }
  };

  const handleUndo = async (id: string) => {
    try {
      await updatePlant(id, { needs_watering: true });
      setRecentlyWatered(prev => prev.filter(pid => pid !== id));
      queryClient.invalidateQueries({ queryKey: ["plants"] });
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
- Current watering frequency: ${manualData.frequency}
- Current watering amount: ${manualData.amount}
Provide: recommended watering amount (ml), optimal schedule, seasonal adjustments, and practical tips. Be concise.`;
    runAiAnalysis(prompt);
  };

  const isTr = i18n.language === "tr";

  // Calendar view helpers
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

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
        <div className="flex items-center gap-1">
          <button onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode("calendar")}
            className={`p-2 rounded-lg ${viewMode === "calendar" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
            <CalendarIcon className="w-4 h-4" />
          </button>
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
              <button onClick={() => { setAnalysisMode("new_manual"); setManualStep("type"); setManualData({ plantType: "", potSize: "", frequency: "", amount: "" }); }}
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
                {/* Step indicator */}
                <div className="flex items-center gap-1 mb-2">
                  {["type", "pot", "frequency", "amount"].map((s, i) => (
                    <div key={s} className={`flex-1 h-1 rounded-full ${
                      ["type", "pot", "frequency", "amount"].indexOf(manualStep) >= i ? "bg-primary" : "bg-secondary"
                    }`} />
                  ))}
                </div>

                {manualStep === "type" && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{isTr ? "Bitki Türü" : "Plant Type"}</p>
                    <input value={manualData.plantType} onChange={e => setManualData({ ...manualData, plantType: e.target.value })}
                      placeholder={isTr ? "Ör: Domates, Fesleğen..." : "e.g. Tomato, Basil..."}
                      className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                    <p className="text-[10px] text-muted-foreground">
                      💡 {isTr ? "Bitki türünü bilmiyorsanız AI Asistan'da 'Bitki Tanıma' kullanın" : "Don't know the type? Use 'Plant Recognition' in AI Assistant"}
                    </p>
                    <button onClick={() => manualData.plantType && setManualStep("pot")} disabled={!manualData.plantType}
                      className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                      {isTr ? "Devam" : "Continue"}
                    </button>
                  </div>
                )}

                {manualStep === "pot" && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{isTr ? "Saksı Boyutu" : "Pot Size"}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {potSizes.map(ps => (
                        <button key={ps.key} onClick={() => { setManualData({ ...manualData, potSize: isTr ? ps.tr : ps.en }); setManualStep("frequency"); }}
                          className="bg-secondary rounded-xl p-3 text-sm text-foreground text-center hover:bg-primary/10 transition-colors">
                          {isTr ? ps.tr : ps.en}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setManualStep("type")} className="text-xs text-primary font-medium">
                      ← {isTr ? "Geri" : "Back"}
                    </button>
                  </div>
                )}

                {manualStep === "frequency" && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{isTr ? "Mevcut Sulama Sıklığı" : "Current Watering Frequency"}</p>
                    <div className="space-y-1.5">
                      {frequencyOptions.map(fo => (
                        <button key={fo.key} onClick={() => { setManualData({ ...manualData, frequency: isTr ? fo.tr : fo.en }); setManualStep("amount"); }}
                          className="w-full bg-secondary rounded-xl p-3 text-sm text-foreground text-left hover:bg-primary/10 transition-colors">
                          {isTr ? fo.tr : fo.en}
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
                    <div className="grid grid-cols-3 gap-2">
                      {amountOptions.map(ao => (
                        <button key={ao.key} onClick={() => { setManualData({ ...manualData, amount: isTr ? ao.tr : ao.en }); }}
                          className={`rounded-xl p-3 text-sm text-center transition-colors ${
                            manualData.amount === (isTr ? ao.tr : ao.en) ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-primary/10"
                          }`}>
                          {isTr ? ao.tr : ao.en}
                        </button>
                      ))}
                    </div>
                    {manualData.amount && (
                      <button onClick={handleManualAnalysis}
                        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold mt-2">
                        {isTr ? "Analiz Et" : "Analyze"}
                      </button>
                    )}
                    <button onClick={() => setManualStep("frequency")} className="text-xs text-primary font-medium">
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
      {viewMode === "calendar" && (
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
                const hasWatering = wateringPlants.length > 0 && isToday;
                return (
                  <div key={day} className={`relative w-full aspect-square flex items-center justify-center rounded-lg text-xs ${
                    isToday ? "bg-primary text-primary-foreground font-bold" : "text-foreground"
                  }`}>
                    {day}
                    {hasWatering && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-blue-500" />}
                  </div>
                );
              })}
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
