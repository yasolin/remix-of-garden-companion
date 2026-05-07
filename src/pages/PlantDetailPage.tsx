import { ArrowLeft, Edit3, Sun, Droplets, Wind, Thermometer, CloudRain, MapPin, Sprout, Save, X, Camera, ImageIcon, Compass, AlertTriangle, Bookmark, MoreVertical, Calendar, Clock, Leaf, FileText, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchPlantById, updatePlant, uploadPlantPhoto, stages, stageFromIndex } from "@/lib/plantService";
import { myPlants as mockPlants } from "@/data/mockData";
import GrowthTimeline from "@/components/GrowthTimeline";
import { toast } from "@/hooks/use-toast";

const PlantDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [careOpen, setCareOpen] = useState(true);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const { data: dbPlant, isLoading } = useQuery({
    queryKey: ["plant", id],
    queryFn: () => fetchPlantById(id!),
    enabled: !!id,
  });

  const mockPlant = mockPlants.find(p => p.id === id);
  const plant = dbPlant || (mockPlant ? {
    id: mockPlant.id, name: mockPlant.name, scientific_name: mockPlant.scientificName,
    photo_url: mockPlant.photo, placement: mockPlant.placement, water_frequency: mockPlant.waterFrequency,
    sunlight: mockPlant.sunlight, wind_sensitivity: mockPlant.windSensitivity, temperature: mockPlant.temperature,
    humidity: mockPlant.humidity, soil_type: mockPlant.soilType, fertilizer: mockPlant.fertilizer,
    notes: mockPlant.notes, current_stage: stages.indexOf(mockPlant.currentStage as any),
    days_to_harvest: mockPlant.daysToHarvest, planted_date: mockPlant.plantedDate,
    needs_watering: mockPlant.needsWatering, user_id: "", created_at: "", updated_at: "",
  } : null) as any;

  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (plant) {
      setForm({
        name: plant.name || "",
        placement: plant.placement || "",
        water_frequency: plant.water_frequency || "",
        sunlight: plant.sunlight || "",
        wind_sensitivity: plant.wind_sensitivity || "",
        temperature: plant.temperature || "",
        humidity: plant.humidity || "",
        soil_type: plant.soil_type || "",
        fertilizer: plant.fertilizer || "",
        notes: plant.notes || "",
        direction: plant.direction || "",
      });
    }
  }, [plant?.id]);

  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!plant) return <div className="flex items-center justify-center h-screen"><p className="text-muted-foreground">{t("detail.notFound")}</p></div>;

  const handlePhotoChange = async (file: File) => {
    if (!userId || !dbPlant) return;
    try {
      const url = await uploadPlantPhoto(userId, file);
      await updatePlant(plant.id, { photo_url: url });
      queryClient.invalidateQueries({ queryKey: ["plant", id] });
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      toast({ title: "✅", description: t("detail.save") });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (dbPlant) {
      try {
        await updatePlant(plant.id, form as any);
        queryClient.invalidateQueries({ queryKey: ["plant", id] });
        queryClient.invalidateQueries({ queryKey: ["plants"] });
        toast({ title: "✅", description: t("detail.save") });
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    }
    setIsEditing(false);
  };

  const careGrid = [
    { icon: Sun, label: t("detail.sun"), value: form.sunlight, key: "sunlight" },
    { icon: Droplets, label: t("detail.watering"), value: form.water_frequency, key: "water_frequency" },
    { icon: Wind, label: t("detail.wind"), value: form.wind_sensitivity, key: "wind_sensitivity" },
    { icon: Thermometer, label: t("detail.temperature"), value: form.temperature, key: "temperature" },
    { icon: CloudRain, label: t("detail.humidity"), value: form.humidity, key: "humidity" },
    { icon: MapPin, label: t("detail.location"), value: form.placement, key: "placement" },
  ];

  const photo = plant.photo_url || (plant as any).photo;
  const daysToHarvest = plant.days_to_harvest ?? 30;
  const currentStage = plant.current_stage ?? 0;
  const scientificName = plant.scientific_name || "";
  const updatedDate = plant.updated_at ? new Date(plant.updated_at).toLocaleDateString() : "";

  return (
    <div className="pb-24 max-w-lg mx-auto bg-background">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files?.[0] && handlePhotoChange(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && handlePhotoChange(e.target.files[0])} />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        {photo ? (
          <img src={photo} alt={form.name} className="w-14 h-14 rounded-2xl object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <Leaf className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="text-lg font-bold text-foreground bg-secondary rounded-lg px-2 py-1 w-full outline-none" />
          ) : (
            <h1 className="text-lg font-bold text-foreground truncate">{form.name}</h1>
          )}
          {scientificName && <p className="text-sm text-muted-foreground italic truncate">{scientificName}</p>}
        </div>
        <button className="p-2 text-muted-foreground"><Bookmark className="w-5 h-5" /></button>
        <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-muted-foreground">
          {isEditing ? <X className="w-5 h-5" /> : <MoreVertical className="w-5 h-5" />}
        </button>
      </div>

      {/* Growth Timeline Card */}
      <div className="px-4">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <GrowthTimeline currentStage={currentStage} />
        </div>
      </div>

      {/* Pills row */}
      <div className="px-4 mt-3 flex gap-2">
        <div className="flex items-center gap-1.5 bg-secondary/60 px-3 py-2 rounded-full">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">{t("detail.harvestIn", { count: daysToHarvest })}</span>
        </div>
        {updatedDate && (
          <div className="flex items-center gap-1.5 bg-secondary/60 px-3 py-2 rounded-full">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{t("detail.lastUpdate")}: {updatedDate}</span>
          </div>
        )}
        {plant.toxic_to_pets && (
          <div className="flex items-center gap-1 bg-destructive/10 px-3 py-2 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-[11px] font-semibold text-destructive">{t("detail.toxicToPets")}</span>
          </div>
        )}
      </div>

      {/* Edit photo options */}
      {isEditing && (
        <div className="px-4 mt-3 flex gap-2">
          <button onClick={() => cameraRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary rounded-xl text-xs font-semibold text-foreground">
            <Camera className="w-4 h-4" /> {t("detail.takePhoto")}
          </button>
          <button onClick={() => galleryRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary rounded-xl text-xs font-semibold text-foreground">
            <ImageIcon className="w-4 h-4" /> {t("detail.chooseFromGallery")}
          </button>
        </div>
      )}

      {/* General Care Summary */}
      <div className="px-4 mt-4">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">{t("detail.careInfo")}</h2>
            </div>
            <button onClick={() => setCareOpen(!careOpen)}
              className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
              {t("detail.showAll")}
              {careOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          {careOpen && (
            <div className="grid grid-cols-3 gap-2.5">
              {careGrid.map((item, i) => (
                <motion.div key={item.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-background rounded-xl p-3 border border-border/50">
                  <item.icon className="w-5 h-5 text-primary mb-2" />
                  <p className="text-xs font-bold text-foreground mb-0.5">{item.label}</p>
                  {isEditing ? (
                    <input value={item.value} onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                      className="text-[11px] text-muted-foreground bg-secondary rounded px-1 py-0.5 w-full outline-none" />
                  ) : (
                    <p className="text-[11px] text-muted-foreground leading-tight line-clamp-3">{item.value || "-"}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Soil & Fertilizer */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Sprout className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">{t("detail.soilFertilizer")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button className="bg-primary/5 rounded-2xl p-3 text-left border border-primary/20 flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs font-bold text-primary mb-1">{t("detail.soilTypeShort")}</p>
              {isEditing ? (
                <input value={form.soil_type} onChange={(e) => setForm({ ...form, soil_type: e.target.value })}
                  className="text-[11px] text-muted-foreground bg-secondary rounded px-1 py-0.5 w-full outline-none" />
              ) : (
                <p className="text-[11px] text-muted-foreground leading-tight">{form.soil_type || "-"}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
          </button>
          <button className="bg-amber-500/5 rounded-2xl p-3 text-left border border-amber-500/20 flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-600 mb-1">{t("detail.fertilizerShort")}</p>
              {isEditing ? (
                <input value={form.fertilizer} onChange={(e) => setForm({ ...form, fertilizer: e.target.value })}
                  className="text-[11px] text-muted-foreground bg-secondary rounded px-1 py-0.5 w-full outline-none" />
              ) : (
                <p className="text-[11px] text-muted-foreground leading-tight">{form.fertilizer || "-"}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-amber-500/60 shrink-0 mt-0.5" />
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <h2 className="text-base font-bold text-foreground">{t("detail.notesShort")}</h2>
        </div>
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-800/30 rounded-2xl p-3 flex items-start gap-2">
          {isEditing ? (
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="flex-1 text-xs text-foreground bg-transparent outline-none resize-none" />
          ) : (
            <p className="flex-1 text-xs text-foreground leading-relaxed">{form.notes || "-"}</p>
          )}
          <ChevronRight className="w-4 h-4 text-blue-500/60 shrink-0 mt-0.5" />
        </div>
      </div>

      {/* Direction (yön) — separate from in-home placement */}
      <div className="px-4 mt-3">
        <div className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">{t("detail.direction")}:</span>
          {isEditing ? (
            <select value={form.direction || ""}
              onChange={(e) => setForm({ ...form, direction: e.target.value })}
              className="flex-1 bg-secondary rounded-lg px-2 py-1 text-xs text-foreground outline-none">
              <option value="">—</option>
              {["Kuzey","Kuzeydoğu","Doğu","Güneydoğu","Güney","Güneybatı","Batı","Kuzeybatı"].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-muted-foreground flex-1">{form.direction || "—"}</span>
          )}
          <button onClick={() => navigate("/location-analysis")}
            className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
            {t("ai.locationAnalysis")}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="px-4 mt-4">
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={handleSave}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> {t("detail.save")}
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default PlantDetailPage;
