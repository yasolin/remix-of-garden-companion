// Plant category → life-cycle stage roadmaps.
// Each category defines its own ordered stages with emoji + TR/EN labels.
// Used by GrowthTimeline and add/edit plant flows so every plant type
// (vegetable, tree, succulent, cactus, palm, mushroom…) shows its own path.

export interface LifecycleStage {
  key: string;
  emoji: string;
  tr: string;
  en: string;
}

export interface LifecycleDef {
  key: string;
  tr: string;
  en: string;
  emoji: string;
  stages: LifecycleStage[];
}

// ---------- Reusable stage building blocks ----------
const S = {
  seedSowing:     { key: "seedSowing",     emoji: "🌱", tr: "Tohum ekimi",           en: "Seed sowing" },
  planted:        { key: "planted",        emoji: "🌱", tr: "Ekildi / Dikildi",       en: "Planted" },
  germination:    { key: "germination",    emoji: "🌿", tr: "Çimlenme",               en: "Germination" },
  seedling:       { key: "seedling",       emoji: "🌱", tr: "Fide dönemi",            en: "Seedling" },
  vegetative:     { key: "vegetative",     emoji: "🍃", tr: "Vejetatif büyüme",       en: "Vegetative growth" },
  budding:        { key: "budding",        emoji: "🌸", tr: "Tomurcuklanma",          en: "Budding" },
  flowering:      { key: "flowering",      emoji: "🌼", tr: "Çiçeklenme",             en: "Flowering" },
  pollination:    { key: "pollination",    emoji: "🐝", tr: "Tozlaşma",               en: "Pollination" },
  fruitSet:       { key: "fruitSet",       emoji: "🍅", tr: "Meyve oluşumu",          en: "Fruit set" },
  ripening:       { key: "ripening",       emoji: "🍎", tr: "Meyve olgunlaşması",     en: "Ripening" },
  harvest:        { key: "harvest",        emoji: "🧺", tr: "Hasat",                  en: "Harvest" },
  endOfLife:      { key: "endOfLife",      emoji: "🍂", tr: "Bitki ömrünün sonu",     en: "End of life" },
  leafGrowth:     { key: "leafGrowth",     emoji: "🍃", tr: "Yaprak gelişimi",        en: "Leaf growth" },
  seedFormation:  { key: "seedFormation",  emoji: "🌾", tr: "Tohum yapma",            en: "Seed making" },
  rootThickening: { key: "rootThickening", emoji: "🥕", tr: "Kök kalınlaşması",       en: "Root thickening" },
  seedRipening:   { key: "seedRipening",   emoji: "🌾", tr: "Tohum olgunlaşması",     en: "Seed ripening" },
  tuberPlanting:  { key: "tuberPlanting",  emoji: "🥔", tr: "Yumru dikimi",           en: "Tuber planting" },
  sprouting:      { key: "sprouting",      emoji: "🌿", tr: "Sürgün verme",           en: "Sprouting" },
  tuberFormation: { key: "tuberFormation", emoji: "🥔", tr: "Yumru oluşumu",          en: "Tuber formation" },
  tuberGrowth:    { key: "tuberGrowth",    emoji: "🥔", tr: "Yumru büyümesi",         en: "Tuber growth" },
  bulbPlanting:   { key: "bulbPlanting",   emoji: "🧅", tr: "Soğan dikimi",           en: "Bulb planting" },
  rooting:        { key: "rooting",        emoji: "🌱", tr: "Köklenme",               en: "Rooting" },
  leafEmergence:  { key: "leafEmergence",  emoji: "🌿", tr: "Yaprak çıkışı",          en: "Leaf emergence" },
  bulbGrowth:     { key: "bulbGrowth",     emoji: "🧅", tr: "Soğan büyümesi",         en: "Bulb growth" },
  dormancy:       { key: "dormancy",       emoji: "😴", tr: "Dormansi (uyku)",        en: "Dormancy" },
  regrowth:       { key: "regrowth",       emoji: "🌱", tr: "Yeniden büyüme",         en: "Regrowth" },
  podFormation:   { key: "podFormation",   emoji: "🫛", tr: "Bakla oluşumu",          en: "Pod formation" },
  seedDevelop:    { key: "seedDevelop",    emoji: "🌾", tr: "Tohum gelişimi",         en: "Seed development" },
  tillering:      { key: "tillering",      emoji: "🌾", tr: "Kardeşlenme",            en: "Tillering" },
  stemElongation: { key: "stemElongation", emoji: "🌾", tr: "Sap uzaması",            en: "Stem elongation" },
  headingSpike:   { key: "headingSpike",   emoji: "🌾", tr: "Başak oluşumu",          en: "Heading" },
  grainFilling:   { key: "grainFilling",   emoji: "🌾", tr: "Dane dolumu",            en: "Grain filling" },
  budSwelling:    { key: "budSwelling",    emoji: "🌰", tr: "Tomurcuk kabarması",     en: "Bud swelling" },
  leafing:        { key: "leafing",        emoji: "🌿", tr: "Yapraklanma",            en: "Leafing" },
  fruitGrowth:    { key: "fruitGrowth",    emoji: "🍏", tr: "Meyve büyümesi",         en: "Fruit growth" },
  leafFall:       { key: "leafFall",       emoji: "🍂", tr: "Yaprak dökümü",          en: "Leaf fall" },
  newShoot:       { key: "newShoot",       emoji: "🌱", tr: "Yeni sürgün",            en: "New shoot" },
  flowerBud:      { key: "flowerBud",      emoji: "🌸", tr: "Çiçek tomurcuğu",        en: "Flower bud" },
  budBreak:       { key: "budBreak",       emoji: "🌱", tr: "Göz uyanması",           en: "Bud break" },
  shootGrowth:    { key: "shootGrowth",    emoji: "🌿", tr: "Sürgün gelişimi",        en: "Shoot growth" },
  clusterFormation:{key: "clusterFormation",emoji:"🍇", tr: "Salkım oluşumu",         en: "Cluster formation" },
  restingPeriod:  { key: "restingPeriod",  emoji: "😴", tr: "Dinlenme dönemi",        en: "Resting period" },
  yearRegrowth:   { key: "yearRegrowth",   emoji: "🌱", tr: "Ertesi yıl büyüme",      en: "Next-year regrowth" },
  cutting:        { key: "cutting",        emoji: "✂️", tr: "Yaprak/çelik alma",      en: "Leaf/cutting take" },
  callus:         { key: "callus",         emoji: "🩹", tr: "Kallus oluşumu",         en: "Callus formation" },
  newLeaves:      { key: "newLeaves",      emoji: "🍃", tr: "Yeni yaprak gelişimi",   en: "New leaf growth" },
  rosetteGrowth:  { key: "rosetteGrowth",  emoji: "🌵", tr: "Rozet büyümesi",         en: "Rosette growth" },
  offsets:        { key: "offsets",        emoji: "🌱", tr: "Yavru oluşturma",        en: "Offsets" },
  succFlower:     { key: "succFlower",     emoji: "🌸", tr: "Çiçeklenme (olgun)",     en: "Flowering (mature)" },
  seedProduction: { key: "seedProduction", emoji: "🌾", tr: "Tohum yapma",            en: "Seed making" },
  cactSeedCut:    { key: "cactSeedCut",    emoji: "🌱", tr: "Tohum / çelik",          en: "Seed / cutting" },
  stemGrowth:     { key: "stemGrowth",     emoji: "🌵", tr: "Gövde gelişimi",         en: "Stem growth" },
  ribSegment:     { key: "ribSegment",     emoji: "🌵", tr: "Kaburga segmentleri",    en: "Rib segments" },
  sideShoots:     { key: "sideShoots",     emoji: "🌵", tr: "Yan sürgün",             en: "Side shoots" },
  cactFlower:     { key: "cactFlower",     emoji: "🌺", tr: "Çiçeklenme",             en: "Flowering" },
  cuttingOrSeed:  { key: "cuttingOrSeed",  emoji: "✂️", tr: "Çelik veya fide",        en: "Cutting or seedling" },
  matureHousePlant:{key: "matureHousePlant",emoji:"🪴",  tr: "Olgun bitki",            en: "Mature plant" },
  propagate:      { key: "propagate",      emoji: "🌱", tr: "Çelik ile çoğaltma",     en: "Propagation" },
  sporeFormation: { key: "sporeFormation", emoji: "🌫️", tr: "Spor oluşumu",           en: "Spore formation" },
  sporeSpread:    { key: "sporeSpread",    emoji: "💨", tr: "Spor yayılımı",          en: "Spore dispersal" },
  youngFern:      { key: "youngFern",      emoji: "🌿", tr: "Genç eğrelti",           en: "Young fern" },
  seed:           { key: "seed",           emoji: "🌰", tr: "Tohum",                  en: "Seed" },
  youngSeedling:  { key: "youngSeedling",  emoji: "🌱", tr: "Genç fide",              en: "Young seedling" },
  trunkThicken:   { key: "trunkThicken",   emoji: "🪵", tr: "Gövde kalınlaşması",     en: "Trunk thickening" },
  matureTree:     { key: "matureTree",     emoji: "🌳", tr: "Olgun ağaç",             en: "Mature tree" },
  fruitOptional:  { key: "fruitOptional",  emoji: "🍒", tr: "Meyve (bazı türler)",    en: "Fruit (some species)" },
  youngTree:      { key: "youngTree",      emoji: "🌲", tr: "Genç ağaç",              en: "Young tree" },
  coneFormation:  { key: "coneFormation",  emoji: "🌲", tr: "Kozalak oluşumu",        en: "Cone formation" },
  myceliumSow:    { key: "myceliumSow",    emoji: "🧫", tr: "Misel ekimi",            en: "Mycelium inoculation" },
  myceliumGrow:   { key: "myceliumGrow",   emoji: "🧬", tr: "Misel gelişimi",         en: "Mycelium colonisation" },
  primordia:      { key: "primordia",      emoji: "🍄", tr: "Primordia (pin)",        en: "Primordia (pins)" },
  mushroomGrow:   { key: "mushroomGrow",   emoji: "🍄", tr: "Mantar gelişimi",        en: "Mushroom development" },
  nextFlush:      { key: "nextFlush",      emoji: "🍄", tr: "Yeni flush",             en: "Next flush" },
} as const;

export const CATEGORY_LIFECYCLES: Record<string, LifecycleDef> = {
  fruitingVegetable: {
    key: "fruitingVegetable", emoji: "🍅",
    tr: "Meyve veren tek yıllık sebze", en: "Fruiting annual vegetable",
    stages: [S.seedSowing, S.germination, S.seedling, S.vegetative, S.budding, S.flowering, S.pollination, S.fruitSet, S.ripening, S.harvest, S.endOfLife],
  },
  leafyVegetable: {
    key: "leafyVegetable", emoji: "🥬",
    tr: "Yaprak sebzesi", en: "Leafy vegetable",
    stages: [S.seedSowing, S.germination, S.leafGrowth, S.harvest, S.seedFormation, S.endOfLife],
  },
  rootVegetable: {
    key: "rootVegetable", emoji: "🥕",
    tr: "Kök sebze", en: "Root vegetable",
    stages: [S.seedSowing, S.germination, S.leafGrowth, S.rootThickening, S.harvest, S.flowering, S.seedRipening],
  },
  tuber: {
    key: "tuber", emoji: "🥔",
    tr: "Yumrulu bitki", en: "Tuber",
    stages: [S.tuberPlanting, S.sprouting, S.leafGrowth, S.tuberFormation, S.tuberGrowth, S.harvest],
  },
  bulb: {
    key: "bulb", emoji: "🧅",
    tr: "Soğanlı bitki", en: "Bulb",
    stages: [S.bulbPlanting, S.rooting, S.leafEmergence, S.flowering, S.bulbGrowth, S.dormancy, S.regrowth],
  },
  legume: {
    key: "legume", emoji: "🫛",
    tr: "Baklagil", en: "Legume",
    stages: [S.seedSowing, S.germination, S.vegetative, S.flowering, S.podFormation, S.seedDevelop, S.harvest],
  },
  grain: {
    key: "grain", emoji: "🌾",
    tr: "Tahıl", en: "Grain",
    stages: [S.seedSowing, S.germination, S.tillering, S.stemElongation, S.headingSpike, S.flowering, S.grainFilling, S.harvest],
  },
  deciduousFruitTree: {
    key: "deciduousFruitTree", emoji: "🍎",
    tr: "Yaprak döken meyve ağacı", en: "Deciduous fruit tree",
    stages: [S.dormancy, S.budSwelling, S.leafing, S.flowering, S.pollination, S.fruitSet, S.fruitGrowth, S.ripening, S.harvest, S.leafFall, S.dormancy],
  },
  citrus: {
    key: "citrus", emoji: "🍊",
    tr: "Narenciye", en: "Citrus",
    stages: [S.newShoot, S.flowerBud, S.flowering, S.fruitSet, S.fruitGrowth, S.ripening, S.harvest],
  },
  grapevine: {
    key: "grapevine", emoji: "🍇",
    tr: "Üzüm asması", en: "Grapevine",
    stages: [S.dormancy, S.budBreak, S.shootGrowth, S.flowering, S.clusterFormation, S.fruitGrowth, S.ripening, S.harvest, S.leafFall],
  },
  annualFlower: {
    key: "annualFlower", emoji: "🌼",
    tr: "Tek yıllık çiçek", en: "Annual flower",
    stages: [S.seedSowing, S.germination, S.leafGrowth, S.budding, S.flowering, S.seedFormation, S.endOfLife],
  },
  perennialFlower: {
    key: "perennialFlower", emoji: "🌷",
    tr: "Çok yıllık çiçek", en: "Perennial flower",
    stages: [S.newShoot, S.leafGrowth, S.budding, S.flowering, S.restingPeriod, S.yearRegrowth],
  },
  succulent: {
    key: "succulent", emoji: "🌵",
    tr: "Sukulent", en: "Succulent",
    stages: [S.cutting, S.callus, S.rooting, S.newLeaves, S.rosetteGrowth, S.offsets, S.succFlower, S.seedProduction],
  },
  cactus: {
    key: "cactus", emoji: "🌵",
    tr: "Kaktüs", en: "Cactus",
    stages: [S.cactSeedCut, S.rooting, S.stemGrowth, S.ribSegment, S.sideShoots, S.cactFlower, S.fruitOptional, S.seedProduction],
  },
  foliageHousePlant: {
    key: "foliageHousePlant", emoji: "🪴",
    tr: "İç mekan yaprak bitkisi", en: "Foliage house plant",
    stages: [S.cuttingOrSeed, S.rooting, S.leafGrowth, S.newShoot, S.matureHousePlant, S.propagate],
  },
  fern: {
    key: "fern", emoji: "🌿",
    tr: "Eğrelti otu", en: "Fern",
    stages: [S.sporeFormation, S.sporeSpread, S.germination, S.youngFern, S.leafGrowth, S.sporeFormation],
  },
  palm: {
    key: "palm", emoji: "🌴",
    tr: "Palmiye", en: "Palm",
    stages: [S.seed, S.germination, S.youngSeedling, S.leafGrowth, S.trunkThicken, S.matureTree, S.flowering, S.fruitOptional],
  },
  conifer: {
    key: "conifer", emoji: "🌲",
    tr: "İğne yapraklı ağaç", en: "Conifer",
    stages: [S.seed, S.germination, S.seedling, S.youngTree, S.coneFormation, S.seedRipening, S.matureTree],
  },
  herb: {
    key: "herb", emoji: "🌿",
    tr: "Aromatik / tıbbi bitki", en: "Herb",
    stages: [S.cuttingOrSeed, S.germination, S.leafGrowth, S.harvest, S.flowering, S.seedProduction],
  },
  mushroom: {
    key: "mushroom", emoji: "🍄",
    tr: "Mantar", en: "Mushroom",
    stages: [S.myceliumSow, S.myceliumGrow, S.primordia, S.mushroomGrow, S.harvest, S.nextFlush],
  },
};

// Default / legacy fallback (matches the previous 11-stage generic lifecycle)
const DEFAULT_LIFECYCLE: LifecycleDef = {
  key: "generic", emoji: "🌱", tr: "Genel", en: "Generic",
  stages: [
    S.planted,
    S.germination,
    { key: "growing", emoji: "🍃", tr: "Büyüyor", en: "Growing" },
    S.budding,
    S.flowering,
    S.pollination,
    { key: "producing", emoji: "🍅", tr: "Ürün oluşturuyor", en: "Producing" },
    S.ripening,
    { key: "harvestReady", emoji: "🧺", tr: "Hasada hazır", en: "Harvest ready" },
    { key: "propagatable", emoji: "🌱", tr: "Tohum yapma", en: "Seed making" },
    { key: "dormant", emoji: "😴", tr: "Dinlenme dönemi", en: "Dormant" },
  ],
};

export function getLifecycle(category?: string | null): LifecycleDef {
  if (category && CATEGORY_LIFECYCLES[category]) return CATEGORY_LIFECYCLES[category];
  return DEFAULT_LIFECYCLE;
}

export function stageLabel(stage: LifecycleStage, lang: string): string {
  return lang?.startsWith("tr") ? stage.tr : stage.en;
}

export function categoryLabel(def: LifecycleDef, lang: string): string {
  return lang?.startsWith("tr") ? def.tr : def.en;
}

export const ALL_CATEGORIES = Object.values(CATEGORY_LIFECYCLES);

// ---------- Automatic category detection from the plant name ----------
// Plants saved before the category picker existed have no `category`, which made
// every plant show the same generic roadmap. We infer a sensible lifecycle from
// the plant name so each species gets its own stages.
const NAME_HINTS: Array<[string, string[]]> = [
  ["fruitingVegetable", ["domates", "tomato", "biber", "pepper", "salatalık", "cucumber", "patlıcan", "eggplant", "kabak", "zucchini", "squash", "çilek", "strawberry", "karpuz", "watermelon", "kavun", "melon", "bamya", "okra"]],
  ["leafyVegetable", ["marul", "lettuce", "ıspanak", "spinach", "roka", "arugula", "lahana", "cabbage", "pazı", "chard", "maydanoz", "parsley", "dereotu", "dill", "tere", "cress", "semizotu"]],
  ["rootVegetable", ["havuç", "carrot", "turp", "radish", "pancar", "beet", "şalgam", "turnip", "kereviz", "celeriac"]],
  ["tuber", ["patates", "potato", "yer elması", "tatlı patates", "sweet potato", "yam"]],
  ["bulb", ["soğan", "onion", "sarımsak", "garlic", "pırasa", "leek", "lale", "tulip", "nergis", "daffodil", "zambak", "lily"]],
  ["legume", ["fasulye", "bean", "bezelye", "pea", "nohut", "chickpea", "mercimek", "lentil", "börülce", "bakla", "fava"]],
  ["grain", ["buğday", "wheat", "arpa", "barley", "mısır", "corn", "maize", "yulaf", "oat", "çavdar", "rye", "pirinç", "rice"]],
  ["deciduousFruitTree", ["elma", "apple", "armut", "pear", "kiraz", "cherry", "vişne", "şeftali", "peach", "erik", "plum", "kayısı", "apricot", "incir", "fig", "nar", "pomegranate", "ceviz", "walnut", "badem", "almond", "dut", "mulberry"]],
  ["citrus", ["limon", "lemon", "portakal", "orange", "mandalina", "mandarin", "tangerine", "greyfurt", "grapefruit", "bergamot", "lime", "misket limonu"]],
  ["grapevine", ["üzüm", "grape", "asma", "vine"]],
  ["annualFlower", ["menekşe", "pansy", "petunya", "petunia", "kadife çiçeği", "marigold", "aslanağzı", "ayçiçeği", "sunflower", "zinnia"]],
  ["perennialFlower", ["gül", "rose", "ortanca", "hydrangea", "lavanta", "lavender", "papatya", "daisy", "karanfil", "carnation", "şakayık", "peony", "orkide", "orchid"]],
  ["succulent", ["sukulent", "succulent", "aloe", "sedum", "echeveria", "haworthia", "yeşim", "jade", "kalanchoe", "agave"]],
  ["cactus", ["kaktüs", "cactus", "opuntia", "mammillaria", "san pedro"]],
  ["foliageHousePlant", ["monstera", "difenbahya", "dieffenbachia", "pothos", "sarmaşık", "ivy", "sansevieria", "paşa kılıcı", "benjamin", "ficus", "kauçuk", "rubber", "philodendron", "zz", "barış çiçeği", "spathiphyllum", "calathea", "aglaonema", "begonya", "begonia"]],
  ["fern", ["eğrelti", "fern", "nephrolepis", "adiantum"]],
  ["palm", ["palmiye", "palm", "areka", "areca", "yucca", "hurma"]],
  ["conifer", ["çam", "pine", "ladin", "spruce", "sedir", "cedar", "ardıç", "juniper", "servi", "cypress", "köknar", "fir"]],
  ["herb", ["fesleğen", "basil", "nane", "mint", "kekik", "thyme", "biberiye", "rosemary", "adaçayı", "sage", "melisa", "reyhan", "oregano", "lemon balm"]],
  ["mushroom", ["mantar", "mushroom", "istiridye", "oyster", "shiitake"]],
];

export function inferCategoryFromName(name?: string | null): string | null {
  if (!name) return null;
  const n = name.toLocaleLowerCase("tr");
  for (const [category, hints] of NAME_HINTS) {
    if (hints.some((h) => n.includes(h))) return category;
  }
  return null;
}

/** Lifecycle for a plant record: explicit category first, then name inference. */
export function getLifecycleForPlant(plant: { category?: string | null; name?: string | null }): LifecycleDef {
  if (plant.category && CATEGORY_LIFECYCLES[plant.category]) return CATEGORY_LIFECYCLES[plant.category];
  const inferred = inferCategoryFromName(plant.name);
  return getLifecycle(inferred);
}
