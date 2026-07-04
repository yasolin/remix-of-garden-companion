import { ArrowLeft, MapPin, Plus, Trash2, Sparkles, Leaf, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserLocations, createLocation, deleteLocation, type LocationRow } from "@/lib/locationService";
import { fetchUserPlants } from "@/lib/plantService";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = ["indoor", "balcony", "garden", "window", "greenhouse", "other"] as const;

const LocationsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "indoor", direction: "", notes: "" });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations", user?.id],
    queryFn: () => fetchUserLocations(user!.id),
    enabled: !!user,
  });
  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  const plantsFor = (locId: string) => plants.filter((p: any) => p.location_id === locId);

  const handleSave = async () => {
    if (!user || !form.name.trim()) return;
    try {
      await createLocation({
        user_id: user.id,
        name: form.name.trim(),
        category: form.category,
        direction: form.direction || null,
        notes: form.notes || null,
      });
      qc.invalidateQueries({ queryKey: ["locations"] });
      setForm({ name: "", category: "indoor", direction: "", notes: "" });
      setAddOpen(false);
      toast({ title: "✅", description: t("locations.save") });
    } catch (e: any) {
      toast({ title: "❌", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (loc: LocationRow) => {
    if (!confirm(t("locations.confirmDelete"))) return;
    try {
      await deleteLocation(loc.id);
      qc.invalidateQueries({ queryKey: ["locations"] });
      qc.invalidateQueries({ queryKey: ["plants"] });
    } catch (e: any) {
      toast({ title: "❌", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("locations.title")}</h1>
        </div>
        <button onClick={() => setAddOpen(true)} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      <AnimatePresence>
        {addOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="px-4 overflow-hidden">
            <div className="bg-card rounded-2xl p-4 border border-border space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">{t("locations.newLocation")}</h3>
                <button onClick={() => setAddOpen(false)} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
              </div>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={t("locations.namePlaceholder")}
                className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm outline-none" />
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">{t("locations.categoryLabel")}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, category: c })}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        form.category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      }`}>{t(`locations.categories.${c}`)}</button>
                  ))}
                </div>
              </div>
              <input value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}
                placeholder="Yön (Kuzey / Güney / Doğu / Batı)"
                className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm outline-none" />
              <button onClick={handleSave} disabled={!form.name.trim()}
                className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl disabled:opacity-50">
                {t("locations.save")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 mt-4 space-y-3">
        {locations.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-border text-center">
            <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("locations.empty")}</p>
            <button onClick={() => setAddOpen(true)} className="mt-3 bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium">
              {t("locations.addFirst")}
            </button>
          </div>
        ) : (
          locations.map((loc, i) => {
            const linked = plantsFor(loc.id);
            return (
              <motion.div key={loc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{loc.name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {loc.category ? t(`locations.categories.${loc.category}`) : "—"}
                      {loc.direction && ` • ${loc.direction}`}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(loc)} className="p-2 rounded-lg hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 text-destructive/60" />
                  </button>
                </div>

                {!loc.ai_analyzed && (
                  <button onClick={() => navigate("/location-analysis")}
                    className="w-full mt-3 flex items-center gap-2 bg-accent/10 text-accent px-3 py-2 rounded-xl text-xs font-semibold">
                    <Sparkles className="w-4 h-4" /> {t("locations.analyzeCta")}
                  </button>
                )}

                {linked.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-[11px] font-semibold text-muted-foreground mb-2">{t("locations.plantsHere")} ({linked.length})</p>
                    <div className="flex gap-2 overflow-x-auto">
                      {linked.map((p: any) => (
                        <button key={p.id} onClick={() => navigate(`/plant/${p.id}`)}
                          className="shrink-0 flex flex-col items-center gap-1">
                          {p.photo_url ? (
                            <img src={p.photo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                              <Leaf className="w-5 h-5 text-muted-foreground/40" />
                            </div>
                          )}
                          <span className="text-[10px] font-medium text-foreground max-w-[52px] truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LocationsPage;
