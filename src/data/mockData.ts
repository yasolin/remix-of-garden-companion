export interface Plant {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  currentStage: "planting" | "germination" | "flowering" | "fruiting" | "harvest";
  daysToHarvest: number;
  plantedDate: string;
  needsWatering: boolean;
  sunlight: string;
  waterFrequency: string;
  windSensitivity: string;
  placement: string;
}

export const stages = ["planting", "germination", "flowering", "fruiting", "harvest"] as const;

export const stageLabels: Record<string, string> = {
  planting: "Ekim",
  germination: "Çimlenme",
  flowering: "Çiçeklenme",
  fruiting: "Meyve",
  harvest: "Hasat",
};

export const myPlants: Plant[] = [
  {
    id: "1",
    name: "Kiraz Domates",
    scientificName: "Solanum lycopersicum",
    image: "🍅",
    currentStage: "fruiting",
    daysToHarvest: 2,
    plantedDate: "2026-01-15",
    needsWatering: false,
    sunlight: "Tam güneş",
    waterFrequency: "2 günde bir",
    windSensitivity: "Orta",
    placement: "Balkon",
  },
  {
    id: "2",
    name: "Fesleğen",
    scientificName: "Ocimum basilicum",
    image: "🌿",
    currentStage: "flowering",
    daysToHarvest: 5,
    plantedDate: "2026-02-01",
    needsWatering: true,
    sunlight: "Yarı gölge",
    waterFrequency: "Her gün",
    windSensitivity: "Yüksek",
    placement: "Doğu/Batı pencere yakını",
  },
  {
    id: "3",
    name: "Nane",
    scientificName: "Mentha spicata",
    image: "🌱",
    currentStage: "germination",
    daysToHarvest: 20,
    plantedDate: "2026-02-25",
    needsWatering: true,
    sunlight: "Yarı gölge",
    waterFrequency: "Her gün",
    windSensitivity: "Düşük",
    placement: "Mutfak penceresi",
  },
  {
    id: "4",
    name: "Biber",
    scientificName: "Capsicum annuum",
    image: "🌶️",
    currentStage: "flowering",
    daysToHarvest: 12,
    plantedDate: "2026-01-20",
    needsWatering: false,
    sunlight: "Tam güneş",
    waterFrequency: "3 günde bir",
    windSensitivity: "Orta",
    placement: "Balkon",
  },
];

export interface SeasonalSuggestion {
  name: string;
  emoji: string;
  season: string;
  tip: string;
}

export const seasonalSuggestions: SeasonalSuggestion[] = [
  { name: "Marul", emoji: "🥬", season: "İlkbahar", tip: "Serin havada harika büyür" },
  { name: "Havuç", emoji: "🥕", season: "İlkbahar", tip: "Derin toprakta ekin" },
  { name: "Bezelye", emoji: "🫛", season: "İlkbahar", tip: "Destekle büyütün" },
  { name: "Maydanoz", emoji: "🌿", season: "İlkbahar", tip: "Her mevsim ekilebilir" },
  { name: "Turp", emoji: "🔴", season: "İlkbahar", tip: "30 günde hasat" },
];
