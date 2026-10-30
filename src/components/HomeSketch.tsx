import { useState } from "react";
import { ArrowDown, ArrowUp, Leaf, Loader2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readRoomMap } from "@/lib/roomMap";
import { type LocationRow, updateLocation } from "@/lib/locationService";
import type { PlantRow } from "@/lib/plantService";
import { toast } from "@/hooks/use-toast";

export default function HomeSketch({ locations, plants, tr, onOpen, onSaved }: { locations: LocationRow[]; plants: PlantRow[]; tr: boolean; onOpen: (id: string) => void; onSaved: () => Promise<void> }) {
  const [selected, setSelected] = useState<string | null>(locations[0]?.id || null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState(() => [...locations].sort((a, b) => readRoomMap(a.map_data).order - readRoomMap(b.map_data).order).map(l => l.id));
  const ordered = [...locations].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const active = locations.find(l => l.id === selected);
  const linked = plants.filter(p => p.location_id === selected);
  const move = (index: number, delta: number) => { const next = [...order]; const target = index + delta; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setOrder(next); };
  const save = async () => { setSaving(true); try { await Promise.all(ordered.map((loc, index) => updateLocation(loc.id, { map_data: { ...readRoomMap(loc.map_data, loc.direction), order: index } }))); await onSaved(); setEditing(false); toast({ title: tr ? "Kroki kaydedildi" : "Sketch saved" }); } catch (e) { toast({ title: tr ? "Kroki kaydedilemedi" : "Unable to save sketch", description: e instanceof Error ? e.message : "", variant: "destructive" }); } finally { setSaving(false); } };
  return <section>
    <div className="flex justify-between items-center mb-4"><div><h2 className="text-xl font-bold">{tr ? "Evim" : "My home"}</h2><p className="text-xs text-muted-foreground">{tr ? "Kroki" : "Sketch"} · {locations.length} {tr ? "oda" : "rooms"} · {plants.filter(p => locations.some(l => l.id === p.location_id)).length} {tr ? "bitki" : "plants"}</p></div><Button variant="outline" size="sm" disabled={saving} onClick={() => editing ? void save() : setEditing(true)}>{saving ? <Loader2 className="animate-spin" /> : editing ? (tr ? "Kaydet" : "Save") : (tr ? "Düzenle" : "Edit")}</Button></div>
    <p className="text-right text-xs font-semibold text-muted-foreground mb-2">{tr ? "Kuzey ↑" : "North ↑"}</p>
    <div className="grid grid-cols-2 gap-0.5 mb-3" aria-label={tr ? "Ev krokisi" : "Home sketch"}>{ordered.map((loc, index) => { const roomPlants = plants.filter(p => p.location_id === loc.id); const outside = ["balcony", "garden", "greenhouse", "outdoor"].includes(loc.category || ""); const map = readRoomMap(loc.map_data, loc.direction); return <div key={loc.id} className={`home-sketch-room ${outside ? "home-sketch-outdoor" : ""} ${selected === loc.id ? "home-sketch-selected" : ""}`}>
      <Button variant="ghost" className="h-full w-full p-2 flex-col items-stretch justify-start gap-2 hover:bg-transparent whitespace-normal" aria-label={`${loc.name} ${tr ? "odasını seç" : "select room"}`} onClick={() => setSelected(loc.id)}><span className="flex justify-between gap-1 text-xs font-bold"><span className="break-words text-left">{loc.name}</span><span className="rounded-full bg-primary/10 text-primary px-1.5 h-4 text-[10px]">{roomPlants.length}</span></span><span className="flex flex-wrap justify-center gap-3 py-3">{roomPlants.slice(0, 4).map(p => <span key={p.id} className="flex flex-col items-center gap-1 w-12"><span className="room-plant-icon"><Leaf className="!size-3 text-primary" /></span><span className="text-[9px] font-semibold leading-tight break-words">{p.name}</span></span>)}{!roomPlants.length && <span className="text-[10px] text-muted-foreground">{tr ? "Henüz bitki yok" : "No plants yet"}</span>}</span></Button>
      {map.windows.map(w => <span key={w} className={`home-sketch-window home-sketch-window-${w}`} />)}
      {editing && <div className="flex justify-center gap-2 pb-2"><Button variant="outline" size="icon" className="size-7" disabled={index === 0} aria-label={`${loc.name} ${tr ? "öne taşı" : "move earlier"}`} onClick={() => move(index, -1)}><ArrowUp className="!size-3" /></Button><Button variant="outline" size="icon" className="size-7" disabled={index === ordered.length - 1} aria-label={`${loc.name} ${tr ? "sona taşı" : "move later"}`} onClick={() => move(index, 1)}><ArrowDown className="!size-3" /></Button></div>}
    </div>; })}</div>
    <div className="flex justify-center gap-3 text-[10px] text-muted-foreground mb-5"><span className="flex items-center gap-1"><i className="room-window-key" />{tr ? "Pencere" : "Window"}</span><span className="flex items-center gap-1"><i className="room-outdoor-key" />{tr ? "Dış mekan" : "Outdoor"}</span></div>
    {active && <div className="border-t border-border pt-4"><div className="flex justify-between mb-3"><h3 className="font-bold text-sm">{active.name}</h3><span className="text-xs text-primary">{linked.length} {tr ? "bitki" : "plants"}</span></div><div className="flex flex-wrap gap-2 mb-4">{linked.map(p => <span key={p.id} className="flex items-center gap-1.5 text-xs bg-secondary rounded-full py-1.5 px-2"><Leaf className="size-3 text-primary" />{p.name}</span>)}</div><Button className="w-full h-11 rounded-xl" onClick={() => onOpen(active.id)}><Map />{tr ? "Oda haritasını aç" : "Open room map"}</Button></div>}
  </section>;
}