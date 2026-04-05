import { ArrowLeft, Edit3, Sun, Droplets, Wind, Thermometer, CloudRain, MapPin, Sprout, Save, X, Camera, ImageIcon, Compass, AlertTriangle } from "lucide-react";
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
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
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

  // Fallback to mock
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
    setShowPhotoOptions(false);
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

  const infoItems = [
    { icon: Sun, label: t("detail.sun"), value: form.sunlight, key: "sunlight" },
    { icon: Droplets, label: t("detail.watering"), value: form.water_frequency, key: "water_frequency" },
    { icon: Wind, label: t("detail.wind"), value: form.wind_sensitivity, key: "wind_sensitivity" },
    { icon: Thermometer, label: t("detail.temperature"), value: form.temperature, key: "temperature" },
    { icon: CloudRain, label: t("detail.humidity"), value: form.humidity, key: "humidity" },
    { icon: MapPin, label: t("detail.location"), value: form.placement, key: "placement" },
    { icon: Compass, label: t("detail.direction"), value: form.direction || "-", key: "direction" },
  ];

  const photo = plant.photo_url || plant.photo;
  const daysToHarvest = plant.days_to_harvest ?? 30;
  const currentStage = plant.current_stage ?? 0;
  const scientificName = plant.scientific_name || "";
  const plantedDate = plant.planted_date ? new Date(plant.planted_date).toLocaleDateString() : "";

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files?.[0] && handlePhotoChange(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && handlePhotoChange(e.target.files[0])} />

      <div className="relative">
        {photo ? <img src={photo} alt={form.name} className="w-full h-56 object-cover" />
          : <div className="w-full h-56 bg-secondary" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-background/60 backdrop-blur-sm">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 right-4 p-2 rounded-full bg-background/60 backdrop-blur-sm">
          {isEditing ? <X className="w-5 h-5 text-foreground" /> : <Edit3 className="w-5 h-5 text-foreground" />}
        </button>
      </div>

      {/* Photo edit options */}
      {isEditing && (
        <div className="px-4 mt-2 flex gap-2">
          <button onClick={() => cameraRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary rounded-xl text-sm font-semibold text-foreground">
            <Camera className="w-4 h-4" /> {t("detail.takePhoto")}
          </button>
          <button onClick={() => galleryRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary rounded-xl text-sm font-semibold text-foreground">
            <ImageIcon className="w-4 h-4" /> {t("detail.chooseFromGallery")}
          </button>
        </div>
      )}

      <div className="px-4 -mt-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 shadow-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              {isEditing ? (
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="text-xl font-bold text-foreground bg-secondary rounded-lg px-2 py-1 outline-none" />
              ) : (
                <h1 className="text-xl font-bold text-foreground">{form.name}</h1>
              )}
              <p className="text-sm text-muted-foreground italic">{scientificName}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{t(`stages.${stageFromIndex(currentStage)}`)}</span>
              </div>
              {plant.toxic_to_pets && (
                <div className="flex items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                  <span className="text-[10px] font-semibold text-destructive">{t("detail.toxicToPets")}</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              daysToHarvest <= 3 ? "bg-primary text-primary-foreground"
                : daysToHarvest <= 7 ? "bg-accent text-accent-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}>{t("detail.harvestIn", { count: daysToHarvest })}</span>
            {plantedDate && <span className="text-xs text-muted-foreground">{t("detail.plantedDate", { date: plantedDate })}</span>}
          </div>
          <GrowthTimeline currentStage={currentStage} />
        </motion.div>

        <h2 className="text-lg font-bold text-foreground mt-6 mb-3">{t("detail.careInfo")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {infoItems.map((item, i) => (
            <motion.div key={item.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="bg-card rounded-xl p-3 shadow-card border border-border">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
              </div>
              {isEditing ? (
                <input value={item.value} onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                  className="text-sm font-bold text-foreground bg-secondary rounded-lg px-2 py-1 w-full outline-none" />
              ) : (
                <p className="text-sm font-bold text-foreground">{item.value}</p>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {[
            { title: t("detail.soilType"), key: "soil_type" },
            { title: t("detail.fertilizer"), key: "fertilizer" },
            { title: t("detail.notes"), key: "notes", textarea: true },
          ].map((item) => (
            <motion.div key={item.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 shadow-card border border-border">
              <h3 className="text-sm font-bold text-foreground mb-1">{item.title}</h3>
              {isEditing ? (
                item.textarea ? (
                  <textarea value={form[item.key]} onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                    className="text-sm text-muted-foreground bg-secondary rounded-lg px-2 py-1 w-full outline-none resize-none" rows={2} />
                ) : (
                  <input value={form[item.key]} onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                    className="text-sm text-muted-foreground bg-secondary rounded-lg px-2 py-1 w-full outline-none" />
                )
              ) : (
                <p className="text-sm text-muted-foreground">{form[item.key]}</p>
              )}
            </motion.div>
          ))}
        </div>

        {isEditing && (
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={handleSave}
            className="w-full mt-4 bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> {t("detail.save")}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default PlantDetailPage;
