import { ArrowLeft, Camera, PenLine, Sparkles, Save, MapPin, Compass, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { insertPlant, uploadPlantPhoto } from "@/lib/plantService";
import { getLifecycle, inferCategoryFromName } from "@/lib/plantLifecycles";

import { generateWateringPlan, frequencyToDays } from "@/lib/wateringService";
import { analyzePlantPhoto } from "@/lib/plantAI";
import { fetchUserLocations, createLocation } from "@/lib/locationService";
import { toast } from "@/hooks/use-toast";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import PlantTypePicker from "@/components/PlantTypePicker";
import { inferLocationCategory } from "@/lib/locationCategories";
import { fileToCompressedDataUrl } from "@/lib/imageUtils";

type AddMode = "select" | "manual" | "ai";

const AddPlantPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AddMode>("select");
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", scientificName: "", placement: "", waterFrequency: "",
    sunlight: "", windSensitivity: "", currentStage: "planted" as string,
    temperature: "", humidity: "", soilType: "", notes: "", fertilizer: "",
    plantedDate: new Date().toISOString().split("T")[0],
    lastWateredDate: "",
    neverWatered: false,
    locationId: "" as string,
    category: "" as string,
    direction: "",
    sunExposure: "",
    locationAnalyzed: false,
  });


  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");

  const [locations, setLocations] = useState<any[]>([]);
  useEffect(() => {
    if (userId) fetchUserLocations(userId).then(setLocations).catch(() => {});
  }, [userId]);

  // Prefill from an AI analysis handed over by the AI Assistant page
  const routeState = useLocation().state as { aiAnalysis?: Record<string, string>; draft?: { form: typeof form; photoFile: File | null; photoPreview: string; newLocationName: string }; locationResult?: { direction: string; sunExposure: string } } | null;
  useEffect(() => {
    if (routeState?.draft) {
      const draft = routeState.draft;
      const result = routeState.locationResult;
      setForm({ ...draft.form, ...(result ? { direction: result.direction, sunExposure: result.sunExposure, locationAnalyzed: true } : {}) });
      setPhotoFile(draft.photoFile); setPhotoPreview(draft.photoPreview); setNewLocationName(draft.newLocationName); setMode("manual");
      return;
    }
    const a = routeState?.aiAnalysis;
    if (!a) return;
    setMode("manual");
    setForm(prev => ({
      ...prev,
      name: a.name || prev.name,
      scientificName: a.scientificName || prev.scientificName,
      placement: a.placement || prev.placement,
      waterFrequency: a.waterFrequency || prev.waterFrequency,
      sunlight: a.sunlight || prev.sunlight,
      windSensitivity: a.windSensitivity || prev.windSensitivity,
      temperature: a.temperature || prev.temperature,
      humidity: a.humidity || prev.humidity,
      soilType: a.soilType || prev.soilType,
      fertilizer: a.fertilizer || prev.fertilizer,
      notes: a.notes || prev.notes,
      category: inferCategoryFromName(a.name) || "",
      currentStage: getLifecycle(inferCategoryFromName(a.name)).stages[0]?.key || "planted",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handlePhotoSelected = (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleAiAnalyze = () => { cameraRef.current?.click(); };

  const handleAiPhotoSelected = async (file: File) => {
    handlePhotoSelected(file);
    setAiAnalyzing(true);
    setMode("ai");
    try {
      const base64 = await fileToCompressedDataUrl(file);
      const result = await analyzePlantPhoto(base64, i18n.language);
      const category = inferCategoryFromName(result.name) || "";
      setForm(prev => ({ ...prev, name: result.name || "", scientificName: result.scientificName || "", placement: result.placement || "", waterFrequency: result.waterFrequency || "", sunlight: result.sunlight || "", windSensitivity: result.windSensitivity || "", temperature: result.temperature || "", humidity: result.humidity || "", soilType: result.soilType || "", fertilizer: result.fertilizer || "", notes: result.notes || "", category, currentStage: getLifecycle(category).stages[0]?.key || "planted" }));
    } catch (e) {
      toast({ title: i18n.language.startsWith("tr") ? "Analiz yapılamadı" : "Analysis failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally { setAiAnalyzing(false); setMode("manual"); }
  };

  const handleSave = async () => {
    if (saving) return;
    if (!userId) {
      toast({ title: "⚠️", description: i18n.language.startsWith("tr") ? "Bitki kaydetmek için giriş yapın." : "Please sign in to save plants", variant: "destructive" });
      return;
    }
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast({ title: "❌", description: t("add.invalidName"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let photoUrl = "";
      if (photoFile) {
        photoUrl = await uploadPlantPhoto(userId, photoFile);
      }

      let locationId: string | null = form.locationId || null;
      const locationName = (newLocationName || form.placement).trim();
      if (!locationId && locationName) {
        const existing = locations.find(l => l.name.toLocaleLowerCase("tr") === locationName.toLocaleLowerCase("tr"));
        if (existing) locationId = existing.id;
        else {
          const loc = await createLocation({ user_id: userId, name: locationName, category: inferLocationCategory(locationName), direction: form.direction || null, sun_exposure: form.sunExposure || null, humidity: form.humidity || null, ai_analyzed: form.locationAnalyzed });
          locationId = loc.id;
        }
      }

      const intervalDays = frequencyToDays(form.waterFrequency);
      const lastWateredAt = form.neverWatered || !form.lastWateredDate
        ? null
        : new Date(form.lastWateredDate).toISOString();

      const inserted = await insertPlant({
        user_id: userId,
        name: form.name.trim(),
        scientific_name: form.scientificName,
        placement: form.placement,
        water_frequency: form.waterFrequency,
        sunlight: form.sunlight,
        wind_sensitivity: form.windSensitivity,
        current_stage: Math.max(0, getLifecycle(form.category).stages.findIndex(s => s.key === form.currentStage)),
        category: form.category || inferCategoryFromName(form.name),
        direction: form.direction || null,
        temperature: form.temperature,

        humidity: form.humidity,
        soil_type: form.soilType,
        fertilizer: form.fertilizer,
        notes: form.notes,
        photo_url: photoUrl,
        planted_date: form.plantedDate || new Date().toISOString(),
        needs_watering: !lastWateredAt,
        watering_interval_days: intervalDays,
        last_watered_at: lastWateredAt,
        ...(locationId ? { location_id: locationId } : {}),
      } as any);

      try {
        await generateWateringPlan({
          userId,
          plantId: inserted.id,
          intervalDays,
          startDate: lastWateredAt ? new Date(lastWateredAt) : new Date(),
          occurrences: 12,
          lastWateredAt,
        });
      } catch (e) {
        toast({ title: i18n.language.startsWith("tr") ? "Bitki kaydedildi, sulama planı oluşturulamadı" : "Plant saved; watering plan failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
      }

      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["watering_events"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({ title: "✅", description: t("add.savePlant") });

      navigate(`/plant/${inserted.id}`);
    } catch (e: any) {
      toast({ title: i18n.language.startsWith("tr") ? "Bitki kaydedilemedi" : "Could not save plant", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const fields = [
    { label: t("add.plantName"), key: "name", placeholder: t("add.plantNamePlaceholder") },
    { label: t("add.scientificName"), key: "scientificName", placeholder: t("add.scientificNamePlaceholder") },
    // placement is rendered separately with the location picker
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

        {/* Location picker: saved locations + new location */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {t("add.placement")}</label>
          {locations.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {locations.map((l: any) => (
                <button key={l.id} type="button"
                  onClick={() => { setForm({ ...form, locationId: l.id, placement: l.name }); setNewLocationName(""); setShowLocationPicker(false); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    form.locationId === l.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
                  }`}>{l.name}</button>
              ))}
            </div>
          )}
          <button type="button" onClick={() => setShowLocationPicker(v => !v)}
            className="text-xs font-semibold text-primary underline">
            {showLocationPicker ? "×" : "+"} {t("locations.addNew")}
          </button>
          {showLocationPicker && (
            <input value={newLocationName}
              onChange={(e) => { setNewLocationName(e.target.value); setForm({ ...form, locationId: "", placement: e.target.value }); }}
              placeholder={t("locations.namePlaceholder")}
              className="w-full bg-secondary rounded-xl px-3 py-2 text-sm outline-none" />
          )}
          {/* Fallback free-text placement (kept in sync with location name) */}
          <input value={form.placement} onChange={(e) => { setNewLocationName(""); setForm({ ...form, placement: e.target.value, locationId: "" }); }}
            placeholder={t("add.placementPlaceholder")}
            className="w-full bg-secondary text-foreground rounded-xl px-3 py-2 text-sm outline-none" />
          {form.direction && <p className="text-xs text-muted-foreground">{form.direction} · {form.sunExposure}</p>}
          <Button type="button" variant="outline" className="w-full text-primary border-primary/30 whitespace-normal h-auto py-2" onClick={() => navigate("/location-analysis", { state: { returnTo: "/add-plant", draft: { form, photoFile, photoPreview, newLocationName } } })}><Compass />{i18n.language.startsWith("tr") ? "Konumunu analiz et" : "Analyze this location"}</Button>
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground">{t("add.plantedDate")}</label>
          <input type="date" value={form.plantedDate} onChange={(e) => setForm({ ...form, plantedDate: e.target.value })}
            className="w-full mt-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div className="bg-secondary/50 border border-border rounded-xl p-3 space-y-2">
          <label className="text-sm font-semibold text-foreground">💧 {t("add.lastWateredQ")}</label>
          <p className="text-[11px] text-muted-foreground">{t("add.lastWateredHint")}</p>
          <input type="date" disabled={form.neverWatered}
            value={form.lastWateredDate} onChange={(e) => setForm({ ...form, lastWateredDate: e.target.value })}
            max={new Date().toISOString().split("T")[0]}
            className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground outline-none disabled:opacity-50" />
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input type="checkbox" checked={form.neverWatered}
              onChange={(e) => setForm({ ...form, neverWatered: e.target.checked, lastWateredDate: e.target.checked ? "" : form.lastWateredDate })}
              className="w-4 h-4 accent-primary" />
            {t("add.neverWatered")}
          </label>
        </div>

        <PlantTypePicker category={form.category} stage={form.currentStage} name={form.name} lang={i18n.language} onChange={(category, currentStage) => setForm({ ...form, category, currentStage })} />

        <div>
          <label className="text-sm font-semibold text-foreground">{t("add.notesLabel")}</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder={t("add.notesPlaceholder")} rows={3}
            className="w-full mt-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>

        <Button disabled={saving} onClick={handleSave}
          className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2">
          {saving ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />} {saving ? (i18n.language.startsWith("tr") ? "Kaydediliyor…" : "Saving…") : t("add.savePlant")}
        </Button>
      </div>
    </div>
  );
};

export default AddPlantPage;
