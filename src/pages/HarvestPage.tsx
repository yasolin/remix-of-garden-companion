import { ArrowLeft, Crown, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchUserPlants } from "@/lib/plantService";
import GrowthTimeline from "@/components/GrowthTimeline";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef } from "react";
import { analyzePlantPhoto } from "@/lib/plantAI";
import { toast } from "@/hooks/use-toast";

// Default harvest days by common plant types
const defaultHarvestDays: Record<string, number> = {
  domates: 70, tomato: 70, biber: 80, pepper: 80, patlıcan: 75, eggplant: 75,
  salatalık: 55, cucumber: 55, kabak: 60, squash: 60, havuç: 75, carrot: 75,
  marul: 45, lettuce: 45, nane: 90, mint: 90, fesleğen: 60, basil: 60,
  maydanoz: 70, parsley: 70, turp: 30, radish: 30, fasulye: 60, bean: 60,
  bezelye: 65, pea: 65, ıspanak: 45, spinach: 45, brokoli: 80, broccoli: 80,
};

function estimateHarvestDays(plant: any): number {
  if (plant.days_to_harvest && plant.days_to_harvest !== 30) return plant.days_to_harvest;
  const name = (plant.name || "").toLowerCase();
  for (const [key, days] of Object.entries(defaultHarvestDays)) {
    if (name.includes(key)) return days;
  }
  // Calculate from planted_date if available
  if (plant.planted_date) {
    const planted = new Date(plant.planted_date);
    const now = new Date();
    const daysSincePlanted = Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = plant.days_to_harvest || 60;
    return Math.max(0, totalDays - daysSincePlanted);
  }
  return plant.days_to_harvest ?? 30;
}

const HarvestPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [aiScanning, setAiScanning] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const isPremium = false; // TODO: check from subscription

  const { data: dbPlants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  const plants = [...dbPlants]
    .map(p => ({ ...p, estimatedDays: estimateHarvestDays(p) }))
    .sort((a, b) => a.estimatedDays - b.estimatedDays);

  const handleAiScan = async (file: File) => {
    setAiScanning(true);
    setAiResult(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const result = await analyzePlantPhoto(reader.result as string, "tr");
          const harvestInfo = result.notes || result.harvest || t("harvest.aiNoResult");
          setAiResult(harvestInfo);
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

      {/* Premium AI Scan */}
      <div className="px-4 mt-3">
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            if (!isPremium) {
              toast({ title: "👑", description: t("harvest.premiumRequired") });
              navigate("/profile");
              return;
            }
            cameraRef.current?.click();
          }}
          className="w-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            {aiScanning ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{t("harvest.aiScan")}</span>
              <span className="text-[10px] font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" /> Premium
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">{t("harvest.aiScanDesc")}</p>
          </div>
        </motion.button>

        {aiResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-card rounded-2xl p-4 border border-primary/20">
            <p className="text-sm text-foreground">{aiResult}</p>
          </motion.div>
        )}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {plants.map((plant, i) => {
          const daysToHarvest = plant.estimatedDays;
          const name = plant.name;
          const scientificName = plant.scientific_name ?? "";
          const currentStage = plant.current_stage ?? 0;

          return (
            <motion.div key={plant.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(`/plant/${plant.id}`)}
              className="bg-card rounded-2xl p-4 shadow-card border border-border cursor-pointer">
              <div className="flex items-center gap-3">
                {plant.photo_url && <img src={plant.photo_url} alt={name} className="w-14 h-14 rounded-xl object-cover" />}
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{name}</h3>
                  <p className="text-xs text-muted-foreground">{scientificName}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  daysToHarvest <= 3 ? "bg-primary text-primary-foreground"
                    : daysToHarvest <= 7 ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}>{t("harvest.days", { count: daysToHarvest })}</span>
              </div>
              <GrowthTimeline currentStage={currentStage} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default HarvestPage;
