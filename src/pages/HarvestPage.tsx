import { ArrowLeft, Sparkles, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchUserPlants } from "@/lib/plantService";
import GrowthTimeline from "@/components/GrowthTimeline";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";

// Plant types that produce fruit/vegetable
const fruitingPlants = new Set([
  "domates", "tomato", "biber", "pepper", "patlıcan", "eggplant",
  "salatalık", "cucumber", "kabak", "squash", "karpuz", "watermelon",
  "kavun", "melon", "fasulye", "bean", "bezelye", "pea",
  "çilek", "strawberry", "elma", "apple", "portakal", "orange",
]);

const defaultHarvestDays: Record<string, number> = {
  domates: 70, tomato: 70, biber: 80, pepper: 80, patlıcan: 75, eggplant: 75,
  salatalık: 55, cucumber: 55, kabak: 60, squash: 60, havuç: 75, carrot: 75,
  marul: 45, lettuce: 45, nane: 90, mint: 90, fesleğen: 60, basil: 60,
  maydanoz: 70, parsley: 70, turp: 30, radish: 30, fasulye: 60, bean: 60,
  bezelye: 65, pea: 65, ıspanak: 45, spinach: 45, brokoli: 80, broccoli: 80,
};

function hasFruitStage(name: string): boolean {
  const lower = name.toLowerCase();
  return [...fruitingPlants].some(fp => lower.includes(fp));
}

function estimateHarvestDays(plant: any): number {
  const name = (plant.name || "").toLowerCase();
  let totalDays = plant.days_to_harvest ?? 30;
  for (const [key, days] of Object.entries(defaultHarvestDays)) {
    if (name.includes(key)) { totalDays = days; break; }
  }
  if (plant.planted_date) {
    const planted = new Date(plant.planted_date);
    const now = new Date();
    const daysSincePlanted = Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, totalDays - daysSincePlanted);
  }
  return totalDays;
}

function estimateCurrentStage(plant: any): number {
  const totalDays = plant.days_to_harvest ?? 60;
  if (!plant.planted_date) return plant.current_stage ?? 0;
  const daysSincePlanted = Math.floor((Date.now() - new Date(plant.planted_date).getTime()) / (1000 * 60 * 60 * 24));
  const progress = daysSincePlanted / totalDays;
  const hasFruit = hasFruitStage(plant.name);
  const numStages = hasFruit ? 5 : 4;
  return Math.min(Math.floor(progress * numStages), numStages - 1);
}

const DAILY_SCAN_KEY = "gardenPotLastScanDate";
const DAILY_SCAN_COUNT_KEY = "gardenPotScanCount";

function canFreeScan(): boolean {
  const lastDate = localStorage.getItem(DAILY_SCAN_KEY);
  const today = new Date().toDateString();
  if (lastDate !== today) return true;
  return parseInt(localStorage.getItem(DAILY_SCAN_COUNT_KEY) || "0") < 1;
}

function recordScan() {
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem(DAILY_SCAN_KEY);
  if (lastDate !== today) {
    localStorage.setItem(DAILY_SCAN_KEY, today);
    localStorage.setItem(DAILY_SCAN_COUNT_KEY, "1");
  } else {
    const count = parseInt(localStorage.getItem(DAILY_SCAN_COUNT_KEY) || "0");
    localStorage.setItem(DAILY_SCAN_COUNT_KEY, String(count + 1));
  }
}

const HarvestPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [aiScanning, setAiScanning] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const isPremium = false;

  const { data: dbPlants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  const plants = [...dbPlants]
    .map(p => ({ ...p, estimatedDays: estimateHarvestDays(p), autoStage: estimateCurrentStage(p) }))
    .sort((a, b) => a.estimatedDays - b.estimatedDays);

  const handleAiScan = async (file: File) => {
    if (!isPremium && !canFreeScan()) {
      toast({ title: "👑", description: t("harvest.dailyLimitReached") });
      return;
    }
    setAiScanning(true);
    setAiResult(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const langInstr = i18n.language === "tr"
            ? "Yanıtını TAMAMEN Türkçe ver."
            : "Respond entirely in English.";

          const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plant-ai`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: [{ role: "user", content: `Analyze this plant image. Determine its current growth stage (germination, flowering, fruiting, or near harvest). Estimate how many days until flowering and harvest. Do NOT provide care tips. Give a concise time-based analysis only. ${langInstr}` }],
              mode: "disease",
              imageBase64: base64,
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
          setAiResult(result || t("harvest.aiNoResult"));
          recordScan();
        } catch (e: any) {
          toast({ title: "❌", description: e.message, variant: "destructive" });
        }
        setAiScanning(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setAiScanning(false);
    }
  };

  const freeScanAvailable = canFreeScan();

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files?.[0] && handleAiScan(e.target.files[0])} />

      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("harvest.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("harvest.subtitle", { count: plants.length })}</p>
        </div>
      </div>

      {/* AI Scan */}
      <div className="px-4 mt-3">
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => cameraRef.current?.click()}
          className="w-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            {aiScanning ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{t("harvest.aiScan")}</span>
              {!isPremium && (
                <span className="text-[10px] font-medium bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                  {freeScanAvailable ? t("harvest.freeScanAvailable") : t("harvest.dailyLimitReached")}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">{t("harvest.aiScanDesc")}</p>
          </div>
        </motion.button>

        {aiResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-card rounded-2xl p-4 border border-primary/20">
            <p className="text-sm text-foreground whitespace-pre-wrap">{aiResult}</p>
          </motion.div>
        )}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {plants.map((plant, i) => {
          const daysToHarvest = plant.estimatedDays;
          const fruit = hasFruitStage(plant.name);

          return (
            <motion.div key={plant.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(`/plant/${plant.id}`)}
              className="bg-card rounded-2xl p-4 shadow-card border border-border cursor-pointer">
              <div className="flex items-center gap-3">
                {plant.photo_url && <img src={plant.photo_url} alt={plant.name} className="w-14 h-14 rounded-xl object-cover" />}
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{plant.name}</h3>
                  <p className="text-xs text-muted-foreground">{plant.scientific_name ?? ""}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-primary" />
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    daysToHarvest <= 3 ? "bg-primary text-primary-foreground"
                      : daysToHarvest <= 7 ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}>{t("harvest.days", { count: daysToHarvest })}</span>
                </div>
              </div>
              <GrowthTimeline currentStage={plant.autoStage} hasFruit={fruit} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default HarvestPage;
