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
const DIRECTIONS = ["Kuzey", "Güney", "Doğu", "Batı", "Kuzeydoğu", "Kuzeybatı", "Güneydoğu", "Güneybatı"] as const;

const LocationsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
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
        <button onClick={() => setChooserOpen(true)} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      {/* How do you want to add the location? */}
      <AnimatePresence>
        {chooserOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="px-4 overflow-hidden">
            <div className="bg-card rounded-2xl p-4 border border-border space-y-2 mt-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-foreground text-sm">{t("locations.howToAdd")}</h3>
                <button onClick={() => setChooserOpen(false)} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
              </div>
              <button
                onClick={() => { setChooserOpen(false); setAddOpen(true); }}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-left active:scale-[0.99] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("locations.addManual")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("locations.addManualDesc")}</p>
                </div>
              </button>
              <button
                onClick={() => { setChooserOpen(false); navigate("/location-analysis"); }}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-left active:scale-[0.99] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("locations.addWithAi")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("locations.addWithAiDesc")}</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">{t("locations.directionLabel")}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {DIRECTIONS.map(d => (
                    <button key={d} onClick={() => setForm({ ...form, direction: form.direction === d ? "" : d })}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        form.direction === d ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      }`}>{d}</button>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/location-analysis")}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-violet-500"
                >
                  <Sparkles className="w-3.5 h-3.5" /> {t("locations.detectDirection")}
                </button>
              </div>
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
            <button onClick={() => setChooserOpen(true)} className="mt-3 bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium">
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
