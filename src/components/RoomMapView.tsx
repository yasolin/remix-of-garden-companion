import { useState } from "react";
import { ArrowLeft, Leaf, Loader2, Plus, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { type LocationRow, updateLocation } from "@/lib/locationService";
import type { PlantRow } from "@/lib/plantService";
import { insideRoom, lightLevel, readRoomMap, WALLS, type Point } from "@/lib/roomMap";
import { toast } from "@/hooks/use-toast";

const shapes = [["rectangle", "Dikdörtgen", "Rectangle"], ["square", "Kare", "Square"], ["l-shape", "L şekli", "L-shaped"], ["custom", "Çiz", "Draw"]];
const wallNames = { north: ["Kuzey", "North"], east: ["Doğu", "East"], south: ["Güney", "South"], west: ["Batı", "West"] };
const wallPoints: Point[] = [{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }];
export default function RoomMapView({ location, plants, tr, onBack, onSaved }: { location: LocationRow; plants: PlantRow[]; tr: boolean; onBack: () => void; onSaved: () => Promise<void> }) {
  const [map, setMap] = useState(() => readRoomMap(location.map_data, location.direction));
  const [shape, setShape] = useState(location.shape || "rectangle");
  const [selected, setSelected] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const change = (next: typeof map) => { setMap(next); setDirty(true); };
  const points = drawing ? map.outline : shape === "custom" && map.outline.length >= 3 ? map.outline : shape === "l-shape" ? [{ x: 0, y: 0 }, { x: 58, y: 0 }, { x: 58, y: 42 }, { x: 100, y: 42 }, { x: 100, y: 100 }, { x: 0, y: 100 }] : [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
  const polygon = points.map(p => `${p.x},${p.y}`).join(" ");
  const placed = plants.filter(p => map.positions[p.id]);
  const active = plants.find(p => p.id === selected);
  const activePoint = active && map.positions[active.id];
  const place = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: Math.round((event.clientX - rect.left) / rect.width * 100), y: Math.round((event.clientY - rect.top) / rect.height * 100) };
    if (drawing) { change({ ...map, outline: [...map.outline, point] }); return; }
    if (!selected) return;
    if (!insideRoom(point, shape, map.outline)) { toast({ title: tr ? "Odanın içinde bir yer seçin" : "Choose a spot inside the room" }); return; }
    change({ ...map, positions: { ...map.positions, [selected]: point } });
  };
  const save = async () => {
    if (drawing || (shape === "custom" && map.outline.length < 3)) { toast({ title: tr ? "Çizimi en az üç köşeyle tamamlayın" : "Finish the outline with at least three corners" }); return; }
    setSaving(true);
    try { await updateLocation(location.id, { shape, map_data: map }); await onSaved(); setDirty(false); toast({ title: tr ? "Harita kaydedildi" : "Map saved" }); }
    catch (e) { toast({ title: tr ? "Harita kaydedilemedi" : "Unable to save map", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setSaving(false); }
  };
  return <div className="room-map-view pb-2">
    <header className="flex items-center gap-2 mb-4"><Button variant="ghost" size="icon" aria-label={tr ? "Geri" : "Back"} onClick={() => { if (!dirty || confirm(tr ? "Kaydedilmemiş değişikliklerden vazgeçilsin mi?" : "Discard unsaved changes?")) onBack(); }}><ArrowLeft /></Button><div className="flex-1 min-w-0"><h1 className="text-xl font-bold break-words">{location.name}</h1><p className="text-xs text-muted-foreground">{tr ? "Oda haritası · tahmini ışık" : "Room map · estimated light"}</p></div><label className="flex items-center gap-2 text-xs font-semibold">{tr ? "Izgara" : "Grid"}<Switch aria-label={tr ? "Izgara" : "Grid"} checked={map.grid} onCheckedChange={grid => change({ ...map, grid })} /></label></header>
    <div className="flex items-center flex-wrap gap-1.5 mb-3"><span className="text-xs font-semibold text-muted-foreground mr-1">{tr ? "Oda şekli" : "Shape"}</span>{shapes.map(s => <Button key={s[0]} size="sm" variant={shape === s[0] ? "default" : "outline"} className="rounded-full px-3 text-xs" onClick={() => { setShape(s[0]); setDirty(true); setDrawing(s[0] === "custom"); if (s[0] === "custom") change({ ...map, outline: [] }); }}>{s[tr ? 1 : 2]}</Button>)}</div>
    {drawing ? <div className="flex items-center gap-2 text-xs mb-4"><span className="flex-1">{tr ? "Köşeler" : "Corners"}: {map.outline.length}</span><Button variant="outline" size="icon" aria-label={tr ? "Son köşeyi geri al" : "Undo last corner"} onClick={() => change({ ...map, outline: map.outline.slice(0, -1) })}><RotateCcw /></Button><Button size="sm" disabled={map.outline.length < 3} onClick={() => setDrawing(false)}><Check />{tr ? "Tamamla" : "Finish"}</Button></div> : <div className="space-y-1.5 text-xs mb-5"><p><span className="room-step">1</span>{tr ? "Pencere olan duvara dokun: +" : "Select a window wall: +"}</p><p><span className="room-step">2</span>{tr ? "Bitkiyi seç, odada yerine dokun" : "Select a plant, then its spot in the room"}</p></div>}
    <p className="text-center text-xs font-semibold text-muted-foreground mb-7">{tr ? "Kuzey ↑" : "North ↑"}</p>
    <div className={`room-map-board mx-5 ${shape === "square" ? "room-map-square" : ""}`}>
      <svg viewBox="-2 -2 104 104" preserveAspectRatio="none" className="room-map-canvas" aria-label={tr ? "Bitki yerleştirme alanı" : "Plant placement area"} onClick={place}>
        <defs><clipPath id="room-outline"><polygon points={polygon} /></clipPath><linearGradient id="room-light" x1={map.windows.includes("west") ? "100%" : "0%"} y1={map.windows.includes("north") ? "100%" : "0%"} x2={map.windows.includes("east") || map.windows.includes("west") ? "100%" : "0%"} y2={map.windows.includes("east") || map.windows.includes("west") ? "0%" : "100%"}><stop offset="0%" className="room-light-low" /><stop offset="100%" className={map.windows.length ? "room-light-bright" : "room-light-low"} /></linearGradient><pattern id="room-grid" width="16.66" height="16.66" patternUnits="userSpaceOnUse"><path d="M 16.66 0 L 0 0 0 16.66" fill="none" className="room-grid-line" strokeWidth="0.3" /></pattern></defs>
        <polygon points={polygon} fill="url(#room-light)" />{map.grid && <polygon points={polygon} fill="url(#room-grid)" />}
        <polygon points={polygon} className="room-outline" fill="none" strokeWidth="1.7" strokeLinejoin="round" />
        {drawing && map.outline.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.5" className="room-drawing-dot" />)}
        {!drawing && <g clipPath="url(#room-outline)">{map.windows.map(w => <line key={w} x1={w === "west" ? 0 : w === "east" ? 100 : 18} x2={w === "west" ? 0 : w === "east" ? 100 : 82} y1={w === "north" ? 0 : w === "south" ? 100 : 18} y2={w === "north" ? 0 : w === "south" ? 100 : 82} className="room-window-line" strokeWidth="4" />)}</g>}
      </svg>
      {!drawing && <><div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-end p-4 text-[10px] font-semibold text-muted-foreground"><span>{tr ? "Loş" : "Low"}</span><span>{tr ? "Orta" : "Medium"}</span><span>{tr ? "Parlak" : "Bright"}</span></div>{WALLS.map((w, i) => <Button key={w} size="icon" variant="outline" className={`room-wall-control ${map.windows.includes(w) ? "room-wall-active" : ""}`} style={{ left: `${wallPoints[i].x}%`, top: `${wallPoints[i].y}%` }} aria-label={`${tr ? "Pencere" : "Window"}: ${wallNames[w][tr ? 0 : 1]}`} aria-pressed={map.windows.includes(w)} onClick={() => change({ ...map, windows: map.windows.includes(w) ? map.windows.filter(x => x !== w) : [...map.windows, w] })}><Plus className="!size-4" /></Button>)}{placed.map(p => <Button key={p.id} variant="ghost" className={`room-plant-marker ${selected === p.id ? "room-plant-selected" : ""}`} style={{ left: `${map.positions[p.id].x}%`, top: `${map.positions[p.id].y}%` }} aria-label={p.name} onClick={() => setSelected(p.id)}><span className="room-plant-icon"><Leaf className="!size-4 text-primary" /></span><span className="room-plant-label">{p.name}</span></Button>)}</>}
    </div>
    <div className="flex justify-center gap-2 flex-wrap mt-5 mb-5">{map.windows.map(w => <span key={w} className="room-window-label">{tr ? "Pencere" : "Window"} · {wallNames[w][tr ? 0 : 1]}</span>)}{!map.windows.length && <span className="text-xs text-muted-foreground">{tr ? "Pencere seçilmedi" : "No windows selected"}</span>}</div>
    {active && activePoint && <div className="room-light-note mb-4"><strong>{active.name}</strong> · {tr ? "Tahmini ışık" : "Estimated light"}: {lightLevel(activePoint, map.windows) === "bright" ? (tr ? "Parlak" : "Bright") : lightLevel(activePoint, map.windows) === "medium" ? (tr ? "Orta" : "Medium") : (tr ? "Loş" : "Low")}</div>}
    <div className="flex flex-wrap gap-2 items-center mb-6"><span className="text-xs font-semibold text-muted-foreground">{tr ? "Yerleştir:" : "Place:"}</span>{plants.map(p => <Button key={p.id} variant={selected === p.id ? "default" : "outline"} size="sm" className="max-w-full h-auto min-h-9 whitespace-normal rounded-lg text-xs" onClick={() => setSelected(p.id)}><Leaf />{p.name}{map.positions[p.id] && <Check className="!size-3" />}</Button>)}{!plants.length && <span className="text-xs text-muted-foreground">{tr ? "Bu odada henüz bitki yok" : "No plants in this room"}</span>}</div>
    {selected && map.positions[selected] && <Button variant="ghost" size="sm" className="text-muted-foreground mb-4" onClick={() => { const positions = { ...map.positions }; delete positions[selected]; change({ ...map, positions }); }}>{tr ? "Haritadan kaldır" : "Remove from map"}</Button>}
    <Button className="w-full h-12 rounded-xl font-semibold" disabled={saving || drawing} onClick={save}>{saving && <Loader2 className="animate-spin" />}{saving ? (tr ? "Kaydediliyor…" : "Saving…") : (tr ? "Haritayı kaydet" : "Save map")}</Button>
  </div>;
}