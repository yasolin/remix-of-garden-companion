import { useState } from "react";
import { Leaf, Check, ChevronRight, Search, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { ALL_CATEGORIES, getLifecycle, categoryLabel, stageLabel, inferCategoryFromName } from "@/lib/plantLifecycles";
import { toast } from "@/hooks/use-toast";

const groups = [
  { tr: "SEBZE VE MEYVE", en: "VEGETABLES AND FRUIT", keys: ["fruitingVegetable", "leafyVegetable", "rootVegetable", "tuber", "bulb", "legume", "grain"] },
  { tr: "AĞAÇ VE ASMA", en: "TREES AND VINES", keys: ["deciduousFruitTree", "citrus", "grapevine", "conifer", "palm"] },
  { tr: "ÇİÇEK", en: "FLOWERS", keys: ["annualFlower", "perennialFlower"] },
  { tr: "DİĞER BİTKİLER", en: "OTHER PLANTS", keys: ["succulent", "cactus", "foliageHousePlant", "fern", "herb", "mushroom"] },
];
const examples: Record<string, [string, string]> = { fruitingVegetable: ["Domates, biber, patlıcan", "Tomato, pepper, eggplant"], leafyVegetable: ["Marul, ıspanak", "Lettuce, spinach"], rootVegetable: ["Havuç, turp", "Carrot, radish"], tuber: ["Patates", "Potato"], citrus: ["Limon, portakal", "Lemon, orange"] };

export default function PlantTypePicker({ category, stage, name, lang, onChange }: { category: string; stage: string; name: string; lang: string; onChange: (category: string, stage: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const tr = lang.startsWith("tr");
  const lifecycle = getLifecycle(category);
  const choose = (key: string) => { onChange(key, getLifecycle(key).stages[0]?.key ?? "planted"); setOpen(false); };
  return <div className="space-y-5">
    <div className="space-y-2">
      <h2 className="font-bold text-foreground">{tr ? "Bitki türü" : "Plant type"}</h2>
      <p className="text-xs text-muted-foreground">{tr ? "Yol haritası seçtiğin türe göre hazırlanır." : "Lifecycle follows your plant type."}</p>
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full h-auto py-3 justify-start whitespace-normal text-left bg-card border-border">
        <span className="bg-primary/10 text-primary p-2 rounded-lg"><Leaf /></span>
        <span className="flex-1"><span className="block font-bold">{category ? categoryLabel(lifecycle, lang) : (tr ? "Bitki türünü seç" : "Choose plant type")}</span><span className="block text-xs text-muted-foreground font-normal">{examples[category]?.[tr ? 0 : 1]}</span></span><ChevronRight />
      </Button>
      <Button variant="outline" className="w-full justify-start border-dashed border-primary text-primary" onClick={() => {
        const inferred = inferCategoryFromName(name);
        if (inferred) choose(inferred); else toast({ title: tr ? "Bitki türünü seçin" : "Choose a plant type", description: tr ? "Bu ad için otomatik eşleştirme bulunamadı." : "No matching type was found for this name." });
      }}><Wand2 />{tr ? "Asistanla otomatik belirle" : "Determine automatically"}</Button>
    </div>
    <div className="space-y-2">
      <h2 className="font-bold text-foreground">{tr ? "Büyüme aşaması" : "Growth stage"}</h2>
      <p className="text-xs text-muted-foreground">{categoryLabel(lifecycle, lang)}</p>
      <div className="flex flex-wrap gap-2">{lifecycle.stages.map((s, i) => <Button key={`${s.key}-${i}`} size="sm" variant={stage === s.key ? "default" : "outline"} className="rounded-full text-xs" onClick={() => onChange(category, s.key)}>{stageLabel(s, lang)}</Button>)}</div>
    </div>
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="max-w-lg mx-auto max-h-[85dvh] bg-card text-card-foreground">
        <DrawerHeader className="text-left"><DrawerTitle>{tr ? "Ne yetiştiriyorsun?" : "What are you growing?"}</DrawerTitle><DrawerDescription className="sr-only">{tr ? "Bitki türünü seç" : "Choose a plant type"}</DrawerDescription></DrawerHeader>
        <div className="px-4 pb-3 relative"><Search className="absolute left-7 top-3 w-4 h-4 text-muted-foreground" /><input aria-label={tr ? "Bitki ara" : "Search plants"} value={search} onChange={e => setSearch(e.target.value)} placeholder={tr ? "Bitki ara, örn. domates" : "Search, e.g. tomato"} className="w-full rounded-lg border border-border bg-secondary text-foreground pl-10 pr-3 py-2.5 text-sm" /></div>
        <div className="overflow-y-auto px-2 pb-6">{groups.map(g => <div key={g.en} className="mb-3"><h3 className="px-3 py-2 text-[11px] font-bold text-muted-foreground">{tr ? g.tr : g.en}</h3>{ALL_CATEGORIES.filter(c => g.keys.includes(c.key) && `${c.tr} ${c.en} ${examples[c.key]?.join(" ") ?? ""}`.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"))).map(c => <Button key={c.key} variant="ghost" onClick={() => choose(c.key)} className={`w-full justify-start h-auto py-3 whitespace-normal text-left ${category === c.key ? "bg-primary/10 text-primary" : "text-foreground"}`}><span className="flex-1">{categoryLabel(c, lang)}{examples[c.key] && <span className="font-normal text-muted-foreground"> · {examples[c.key][tr ? 0 : 1]}</span>}</span>{category === c.key && <Check />}</Button>)}</div>)}</div>
      </DrawerContent>
    </Drawer>
  </div>;
}