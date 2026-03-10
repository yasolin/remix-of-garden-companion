import { ArrowLeft, Camera, PenLine, Sparkles, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { stages, insertPlant, uploadPlantPhoto } from "@/lib/plantService";
import { analyzePlantPhoto } from "@/lib/plantAI";
import { toast } from "@/hooks/use-toast";

type AddMode = "select" | "manual" | "ai";

const AddPlantPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AddMode>("select");
  const [userId, setUserId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const [form, setForm] = useState({
    name: "", scientificName: "", placement: "", waterFrequency: "",
    sunlight: "", windSensitivity: "", currentStage: "planting" as string,
    temperature: "", humidity: "", soilType: "", notes: "", fertilizer: "",
  });

  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const stageLabels: Record<string, string> = {
    planting: t("stages.planting"), germination: t("stages.germination"),
    flowering: t("stages.flowering"), fruiting: t("stages.fruiting"), harvest: t("stages.harvest"),
  };

  const handlePhotoSelected = (file: File) => {
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleAiAnalyze = () => {
    cameraRef.current?.click();
  };

  const handleAiPhotoSelected = async (file: File) => {
    handlePhotoSelected(file);
    setAiAnalyzing(true);
    setMode("ai");
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const result = await analyzePlantPhoto(base64);
          setForm({
            name: result.name || "",
            scientificName: result.scientificName || "",
            placement: result.placement || "",
            waterFrequency: result.waterFrequency || "",
            sunlight: result.sunlight || "",
            windSensitivity: result.windSensitivity || "",
            currentStage: result.currentStage || "planting",
            temperature: result.temperature || "",
            humidity: result.humidity || "",
            soilType: result.soilType || "",
            fertilizer: result.fertilizer || "",
            notes: result.notes || "",
          });
          setMode("manual");
        } catch (e: any) {
          toast({ title: "AI Error", description: e.message, variant: "destructive" });
          setMode("manual");
        }
        setAiAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setAiAnalyzing(false);
      setMode("manual");
    }
  };

  const handleSave = async () => {
    if (!userId) {
      toast({ title: "⚠️", description: "Please sign in to save plants", variant: "destructive" });
      return;
    }
    try {
      let photoUrl = "";
      if (photoFile) {
        photoUrl = await uploadPlantPhoto(userId, photoFile);
      }
      await insertPlant({
        user_id: userId,
        name: form.name,
        scientific_name: form.scientificName,
        placement: form.placement,
        water_frequency: form.waterFrequency,
        sunlight: form.sunlight,
        wind_sensitivity: form.windSensitivity,
        current_stage: stages.indexOf(form.currentStage as any),
        temperature: form.temperature,
        humidity: form.humidity,
        soil_type: form.soilType,
        fertilizer: form.fertilizer,
        notes: form.notes,
        photo_url: photoUrl,
      });
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      toast({ title: "✅", description: t("add.savePlant") });
      navigate("/my-plants");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const fields = [
    { label: t("add.plantName"), key: "name", placeholder: t("add.plantNamePlaceholder") },
    { label: t("add.scientificName"), key: "scientificName", placeholder: t("add.scientificNamePlaceholder") },
    { label: t("add.placement"), key: "placement", placeholder: t("add.placementPlaceholder") },
    { label: t("add.waterFrequency"), key: "waterFrequency", placeholder: t("add.waterFrequencyPlaceholder") },
    { label: t("add.sunlight"), key: "sunlight", placeholder: t("add.sunlightPlaceholder") },
    { label: t("add.windSensitivity"), key: "windSensitivity", placeholder: t("add.windSensitivityPlaceholder") },
    { label: t("detail.temperature"), key: "temperature", placeholder: t("add.temperaturePlaceholder") },
    { label: t("detail.humidity"), key: "humidity", placeholder: t("add.humidityPlaceholder") },
    { label: t("detail.soilType"), key: "soilType", placeholder: t("add.soilTypePlaceholder") },
  ];

  if (mode === "select") {
    return (
      <div className="pb-24 max-w-lg mx-auto">
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleAiPhotoSelected(e.target.files[0])} />
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("add.title")}</h1>
        </div>
        <div className="px-4 mt-8 space-y-4">
          <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onClick={() => setMode("manual")}
            className="w-full bg-card rounded-2xl p-6 shadow-card border border-border flex items-center gap-4 hover:bg-secondary transition-colors">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <PenLine className="w-7 h-7 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-foreground text-lg">{t("add.manualEntry")}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{t("add.manualDesc")}</p>
            </div>
          </motion.button>
          <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            onClick={handleAiAnalyze}
            className="w-full gradient-help rounded-2xl p-6 shadow-card flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-primary-foreground text-lg">{t("add.aiEntry")}</h3>
              <p className="text-sm text-primary-foreground/80 mt-0.5">{t("add.aiDesc")}</p>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  if (aiAnalyzing) {
    return (
      <div className="pb-24 max-w-lg mx-auto flex flex-col items-center justify-center h-[80vh]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t("add.aiAnalyzing")}</h2>
          <p className="text-sm text-muted-foreground text-center px-8">{t("add.aiAnalyzingDesc")}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => setMode("select")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("add.plantInfo")}</h1>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && handlePhotoSelected(e.target.files[0])} />

      <div className="px-4 mt-3">
        {photoPreview ? (
          <div className="relative">
            <img src={photoPreview} alt="Plant" className="w-full h-40 rounded-2xl object-cover" />
            <button onClick={() => fileRef.current?.click()}
              className="absolute bottom-2 right-2 bg-background/60 backdrop-blur-sm rounded-full p-2">
              <Camera className="w-5 h-5 text-foreground" />
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="w-full h-40 rounded-2xl border-2 border-dashed border-border bg-secondary/50 flex flex-col items-center justify-center gap-2 hover:bg-secondary transition-colors">
            <Camera className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">{t("add.addPhoto")}</span>
          </button>
        )}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="text-sm font-semibold text-foreground">{field.label}</label>
            <input value={(form as any)[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              className="w-full mt-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        ))}

        <div>
          <label className="text-sm font-semibold text-foreground">{t("add.growthStage")}</label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {stages.map((stage) => (
              <button key={stage} onClick={() => setForm({ ...form, currentStage: stage })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  form.currentStage === stage ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}>{stageLabels[stage]}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground">{t("add.notesLabel")}</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder={t("add.notesPlaceholder")} rows={3}
            className="w-full mt-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
          className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2">
          <Save className="w-5 h-5" /> {t("add.savePlant")}
        </motion.button>
      </div>
    </div>
  );
};

export default AddPlantPage;
