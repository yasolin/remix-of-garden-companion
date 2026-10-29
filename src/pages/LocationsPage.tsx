import { ArrowLeft, MapPin, Plus, Trash2, Sparkles, Leaf, X, MoreHorizontal, Compass, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserLocations, createLocation, deleteLocation, type LocationRow } from "@/lib/locationService";
import { fetchUserPlants } from "@/lib/plantService";
import { LOCATION_CATEGORIES, inferLocationCategory, locationCategoryLabel } from "@/lib/locationCategories";
import { toast } from "@/hooks/use-toast";

const DIRECTIONS = ["Kuzeybatı", "Kuzey", "Kuzeydoğu", "Batı", "", "Doğu", "Güneybatı", "Güney", "Güneydoğu"];
const EN_DIRECTIONS = ["Northwest", "North", "Northeast", "West", "", "East", "Southwest", "South", "Southeast"];
const ROOM_FILTERS = [["Salon", "Living room"], ["Yatak odası", "Bedroom"], ["Banyo", "Bathroom"], ["Ofis", "Office"]];
type Zone = "indoor" | "outdoor";
const ROOMS: Record<Zone, [string, string, string][]> = {
  indoor: [["Salon", "Living room", "livingRoom"], ["Mutfak", "Kitchen", "indoor"], ["Yatak odası", "Bedroom", "indoor"], ["Banyo", "Bathroom", "indoor"], ["Ofis", "Office", "indoor"], ["Koridor", "Hallway", "indoor"], ["Diğer", "Other", "indoor"]],
  outdoor: [["Balkon", "Balcony", "balcony"], ["Teras", "Terrace", "balcony"], ["Bahçe", "Garden", "garden"], ["Sera", "Greenhouse", "greenhouse"], ["Avlu", "Courtyard", "garden"], ["Diğer", "Other", "outdoor"]],
};
const SHAPES = [["rectangle", "Dikdörtgen", "Rectangle"], ["square", "Kare", "Square"], ["l-shape", "L şekli", "L-shaped"]];
const initialForm = { zone: "indoor" as Zone, room: "", name: "", shape: "rectangle", directions: [] as string[] };
const withTimeout = <T,>(p: Promise<T>, ms: number, msg: string) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);
const chip = (active: boolean) => `rounded-full h-10 px-4 text-sm hover:bg-secondary hover:text-foreground ${active ? "bg-primary border-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:text-primary-foreground" : "bg-card"}`;

const LocationsPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const tr = i18n.language.startsWith("tr");
  const { user } = useAuth();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const { data: locations = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["locations", user?.id],
    queryFn: () => user ? fetchUserLocations(user.id) : Promise.resolve([]),
    enabled: !!user,
  });
  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => user ? fetchUserPlants(user.id) : Promise.resolve([]),
    enabled: !!user,
  });
  const plantsFor = (locId: string) => plants.filter(p => p.location_id === locId);
  const categoryOf = (loc: LocationRow) => !loc.category || loc.category === "indoor" ? inferLocationCategory(loc.name) : loc.category;
  const visibleLocations = filter ? locations.filter(loc => loc.name.toLocaleLowerCase(i18n.language).includes(filter.toLocaleLowerCase(i18n.language))) : locations;

  const handleSave = async (next: "map" | "list") => {
    if (!user || saving) return;
    const name = form.name.trim();
    if (!name) {
      toast({ title: tr ? "Oda adı gerekli" : "Room name required", description: tr ? "Bir oda seçin veya adını yazın." : "Pick a room or type its name.", variant: "destructive" });
      return;
    }
    const room = ROOMS[form.zone].find(r => r[0] === form.room);
    const inferred = inferLocationCategory(name);
    const category = room && room[0] !== "Diğer" ? room[2] : form.zone === "outdoor" ? (["balcony", "garden", "greenhouse"].includes(inferred) ? inferred : "outdoor") : (inferred === "indoor" || inferred === "livingRoom" || inferred === "window" ? inferred : "indoor");
    setSaving(true);
    try {
      const created = await withTimeout(createLocation({ user_id: user.id, name, category, direction: form.directions.join(", ") || null, shape: form.shape }), 15000, tr ? "Bağlantı zaman aşımına uğradı, tekrar deneyin." : "Connection timed out, please try again.");
      await qc.invalidateQueries({ queryKey: ["locations"] });
      setForm(initialForm);
      setFilter(null);
      setAddOpen(false);
      toast({ title: tr ? "Konum kaydedildi" : "Location saved" });
      if (next === "map") navigate("/location-analysis", { state: { locationId: created.id } });
    } catch (e) {
      toast({ title: tr ? "Konum kaydedilemedi" : "Unable to save location", description: e instanceof Error ? e.message : t("common.error"), variant: "destructive" });
    } finally { setSaving(false); }
  };
  const handleDelete = async (loc: LocationRow) => {
    if (!confirm(t("locations.confirmDelete"))) return;
    try {
      await deleteLocation(loc.id);
      qc.invalidateQueries({ queryKey: ["locations"] });
      qc.invalidateQueries({ queryKey: ["plants"] });
    } catch (e) {
      toast({ title: tr ? "Konum silinemedi" : "Unable to delete location", description: e instanceof Error ? e.message : t("common.error"), variant: "destructive" });
    }
  };
  const toggleDirection = (d: string) => setForm(f => ({ ...f, directions: f.directions.includes(d) ? f.directions.filter(x => x !== d) : [...f.directions, d] }));
  const Label = ({ title, hint }: { title: string; hint?: string }) => <p className="text-sm font-bold text-foreground mb-2">{title}{hint && <span className="ml-2 text-xs font-normal text-muted-foreground">{hint}</span>}</p>;

  return (
    <div className="locations-reference min-h-screen max-w-lg mx-auto px-4 pt-4 pb-24">
      <header className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 min-w-0">
          {!addOpen && <Button variant="ghost" size="icon" className="-ml-2 shrink-0 hover:bg-secondary hover:text-foreground" aria-label={tr ? "Geri" : "Back"} onClick={() => navigate(-1)}><ArrowLeft /></Button>}
          <h1 className={`${addOpen ? "text-2xl" : "text-xl"} font-bold text-foreground`}>{addOpen ? (tr ? "Yeni oda" : "New room") : t("locations.title")}</h1>
        </div>
        <Button size="icon" variant={addOpen ? "ghost" : "default"} className="rounded-full shrink-0 hover:bg-secondary hover:text-foreground" aria-label={addOpen ? (tr ? "Kapat" : "Close") : (tr ? "Konum ekle" : "Add location")} onClick={() => { setAddOpen(!addOpen); setForm(initialForm); }}>{addOpen ? <X className="!size-6" /> : <Plus className="!size-6" />}</Button>
      </header>

      {addOpen ? (
        <form onSubmit={e => { e.preventDefault(); void handleSave("map"); }} className="space-y-5">
          <div>
            <Label title={tr ? "Mekan" : "Space"} />
            <div className="grid grid-cols-2 rounded-xl border border-border overflow-hidden bg-card" role="radiogroup">
              {(["indoor", "outdoor"] as Zone[]).map(z => <button type="button" role="radio" aria-checked={form.zone === z} key={z} onClick={() => setForm(f => ({ ...f, zone: z, room: "", name: ROOMS[z].some(r => r[0] === f.room) ? "" : f.name }))} className={`h-12 text-sm transition-colors ${form.zone === z ? "bg-primary text-primary-foreground font-semibold" : "text-foreground"}`}>{z === "indoor" ? (tr ? "İç mekan" : "Indoor") : (tr ? "Dış mekan" : "Outdoor")}</button>)}
            </div>
          </div>
          <div>
            <Label title={tr ? "Oda" : "Room"} hint={tr ? "hızlı seç" : "quick pick"} />
            <div className="flex flex-wrap gap-2">
              {ROOMS[form.zone].map(r => <Button type="button" key={r[0]} variant="outline" aria-pressed={form.room === r[0]} className={chip(form.room === r[0])} onClick={() => setForm(f => ({ ...f, room: r[0], name: r[0] === "Diğer" ? "" : (tr ? r[0] : r[1]) }))}>{tr ? r[0] : r[1]}</Button>)}
            </div>
          </div>
          <div>
            <Label title={tr ? "Oda adı" : "Room name"} hint={tr ? "istersen kendin yaz" : "or type your own"} />
            <Input aria-label={tr ? "Oda adı" : "Room name"} placeholder={t("locations.namePlaceholder")} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-12 bg-secondary border-transparent text-base" />
          </div>
          <div>
            <Label title={tr ? "Oda şekli" : "Room shape"} hint={tr ? "haritada kullanılır" : "used for the map"} />
            <div className="flex flex-wrap gap-2">
              {SHAPES.map(s => <Button type="button" key={s[0]} variant="outline" aria-pressed={form.shape === s[0]} className={chip(form.shape === s[0])} onClick={() => setForm({ ...form, shape: s[0] })}>{tr ? s[1] : s[2]}</Button>)}
            </div>
          </div>
          <fieldset>
            <legend><Label title={tr ? "Pencere yönü" : "Window direction"} hint={tr ? "birden fazla seçebilirsin" : "pick one or more"} /></legend>
            <div className="grid grid-cols-3 gap-2">
              {DIRECTIONS.map((d, index) => d ? <Button type="button" variant="outline" key={d} className={`text-sm h-11 px-1 rounded-xl hover:bg-secondary hover:text-foreground ${form.directions.includes(d) ? "border-primary bg-primary/10 text-primary font-semibold" : "bg-card"}`} aria-pressed={form.directions.includes(d)} onClick={() => toggleDirection(d)}>{tr ? d : EN_DIRECTIONS[index]}</Button> : <div key="compass" className="flex items-center justify-center text-muted-foreground"><Compass className="size-6" /></div>)}
            </div>
            <Button type="button" variant="ghost" className="text-primary px-0 mt-2 text-sm font-semibold hover:bg-transparent hover:text-primary" onClick={() => navigate("/location-analysis")}><Sparkles />{t("locations.detectDirection")}</Button>
          </fieldset>
          <div className="pt-4 space-y-2">
            <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl text-base font-semibold">{saving && <Loader2 className="animate-spin" />}{saving ? (tr ? "Kaydediliyor…" : "Saving…") : (tr ? "Kaydet ve haritaya geç" : "Save and open map")}</Button>
            <Button type="button" variant="ghost" disabled={saving} onClick={() => void handleSave("list")} className="w-full h-11 text-sm font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground">{tr ? "Haritayı sonra çizerim" : "I'll draw the map later"}</Button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-5" aria-label={tr ? "Oda filtresi" : "Room filter"}>
            {ROOM_FILTERS.map(names => { const label = names[tr ? 0 : 1]; return <Button key={names[0]} variant="outline" size="sm" aria-pressed={filter === label} onClick={() => setFilter(filter === label ? null : label)} className={`h-8 px-3 rounded-full text-xs font-medium hover:bg-secondary hover:text-foreground ${filter === label ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "bg-card"}`}>{label}</Button>; })}
          </div>
          {isLoading ? <div className="flex justify-center py-12" role="status"><Loader2 className="size-6 animate-spin text-primary" /><span className="sr-only">{tr ? "Yükleniyor" : "Loading"}</span></div> : isError ? <div className="py-8 text-center"><p className="text-sm text-muted-foreground mb-3">{tr ? "Konumlar yüklenemedi." : "Unable to load locations."}</p><Button variant="outline" onClick={() => refetch()}>{tr ? "Tekrar dene" : "Try again"}</Button></div> : visibleLocations.length === 0 ? <div className="py-10 text-center"><MapPin className="size-9 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">{filter ? (tr ? "Bu odada henüz konum yok" : "No locations in this room") : t("locations.empty")}</p><Button className="mt-4" onClick={() => { setForm({ ...initialForm, name: filter || "" }); setAddOpen(true); }}><Plus />{t("locations.addFirst")}</Button></div> : (
            <div className="space-y-5">
              {(["indoor", "outdoor"] as const).map(zone => {
                const grouped = visibleLocations.filter(loc => (zone === "outdoor") === ["balcony", "garden", "greenhouse", "outdoor"].includes(categoryOf(loc)));
                if (!grouped.length) return null;
                return <section key={zone} className="space-y-3">
                  <h2 className="text-[11px] uppercase font-bold text-muted-foreground">{zone === "indoor" ? (tr ? "İç mekan" : "Indoor") : (tr ? "Dış mekan" : "Outdoor")}</h2>
                  {grouped.map((loc, index) => {
                    const linked = plantsFor(loc.id);
                    const desc = loc.notes || [loc.sun_exposure, loc.direction].filter(Boolean).join(" · ") || locationCategoryLabel(categoryOf(loc), i18n.language);
                    return <motion.article key={loc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15, delay: index * 0.03 }} className="bg-card border border-border rounded-2xl p-3 shadow-sm">
                      <div className="flex items-start gap-2.5">
                        <span className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><MapPin className="size-4 text-primary" /></span>
                        <div className="flex-1 min-w-0 pt-0.5"><h3 className="text-sm font-bold leading-tight break-words">{loc.name}</h3><p className="text-[11px] text-muted-foreground leading-tight mt-1 line-clamp-2">{desc}</p></div>
                        <span aria-label={`${linked.length} ${tr ? "bitki" : "plants"}`} className="min-w-5 h-5 rounded-full px-1.5 bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center mt-1">{linked.length}</span>
                        <DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`${loc.name} ${tr ? "seçenekleri" : "options"}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => navigate("/location-analysis", { state: { locationId: loc.id } })}><Sparkles className="size-4 mr-2" />{t("locations.analyzeCta")}</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete(loc)} className="text-destructive"><Trash2 className="size-4 mr-2" />{tr ? "Sil" : "Delete"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                      </div>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-3 mb-2">{t("locations.plantsHere")}</p>
                      {linked.length ? <div className="flex flex-wrap gap-3">
                        {linked.map(p => <Button key={p.id} variant="ghost" onClick={() => navigate(`/plant/${p.id}`)} className="h-auto w-[58px] p-0 flex-col items-start gap-1 whitespace-normal hover:bg-transparent hover:text-foreground"><span className="size-[58px] bg-primary/10 rounded-xl flex items-center justify-center"><Leaf className="!size-6 text-primary" /></span><span className="text-[10px] leading-tight text-left font-normal break-words line-clamp-2">{p.name}</span></Button>)}
                        <Button variant="ghost" onClick={() => navigate("/add-plant")} className="h-auto w-[58px] p-0 flex-col items-start gap-1 whitespace-normal hover:bg-transparent hover:text-primary"><span className="size-[58px] border border-dashed border-primary/40 rounded-xl flex items-center justify-center"><Plus className="!size-5 text-primary" /></span><span className="text-[10px] text-primary font-semibold leading-tight">{tr ? "Bitki ekle" : "Add plant"}</span></Button>
                      </div> : <Button variant="secondary" onClick={() => navigate("/add-plant")} className="w-full justify-start h-9 text-[11px] text-muted-foreground font-normal rounded-lg">{tr ? "Henüz bitki yok" : "No plants yet"}</Button>}
                    </motion.article>;
                  })}
                </section>;
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default LocationsPage;
