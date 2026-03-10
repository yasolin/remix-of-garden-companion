import tomatoImg from "@/assets/plants/tomato.jpg";
import basilImg from "@/assets/plants/basil.jpg";
import mintImg from "@/assets/plants/mint.jpg";
import pepperImg from "@/assets/plants/pepper.jpg";

export interface Plant {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  photo: string;
  currentStage: "planting" | "germination" | "flowering" | "fruiting" | "harvest";
  daysToHarvest: number;
  plantedDate: string;
  needsWatering: boolean;
  sunlight: string;
  waterFrequency: string;
  windSensitivity: string;
  placement: string;
  temperature: string;
  humidity: string;
  soilType: string;
  fertilizer: string;
  notes: string;
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
    photo: tomatoImg,
    currentStage: "fruiting",
    daysToHarvest: 2,
    plantedDate: "2026-01-15",
    needsWatering: false,
    sunlight: "Tam güneş",
    waterFrequency: "2 günde bir",
    windSensitivity: "Orta",
    placement: "Balkon",
    temperature: "20-30°C",
    humidity: "%60-80",
    soilType: "Humuslu toprak",
    fertilizer: "2 haftada bir sıvı gübre",
    notes: "Destek çubuğu gerekebilir",
  },
  {
    id: "2",
    name: "Fesleğen",
    scientificName: "Ocimum basilicum",
    image: "🌿",
    photo: basilImg,
    currentStage: "flowering",
    daysToHarvest: 5,
    plantedDate: "2026-02-01",
    needsWatering: true,
    sunlight: "Yarı gölge",
    waterFrequency: "Her gün",
    windSensitivity: "Yüksek",
    placement: "Doğu/Batı pencere yakını",
    temperature: "18-28°C",
    humidity: "%50-70",
    soilType: "İyi drene olan toprak",
    fertilizer: "Ayda bir organik gübre",
    notes: "Çiçekleri koparın, yaprak üretimi artar",
  },
  {
    id: "3",
    name: "Nane",
    scientificName: "Mentha spicata",
    image: "🌱",
    photo: mintImg,
    currentStage: "germination",
    daysToHarvest: 20,
    plantedDate: "2026-02-25",
    needsWatering: true,
    sunlight: "Yarı gölge",
    waterFrequency: "Her gün",
    windSensitivity: "Düşük",
    placement: "Mutfak penceresi",
    temperature: "15-25°C",
    humidity: "%50-70",
    soilType: "Nemli, zengin toprak",
    fertilizer: "Ayda bir sıvı gübre",
    notes: "Hızlı yayılır, ayrı saksıda yetiştirin",
  },
  {
    id: "4",
    name: "Biber",
    scientificName: "Capsicum annuum",
    image: "🌶️",
    photo: pepperImg,
    currentStage: "flowering",
    daysToHarvest: 12,
    plantedDate: "2026-01-20",
    needsWatering: false,
    sunlight: "Tam güneş",
    waterFrequency: "3 günde bir",
    windSensitivity: "Orta",
    placement: "Balkon",
    temperature: "20-35°C",
    humidity: "%60-70",
    soilType: "Kumlu-tınlı toprak",
    fertilizer: "2 haftada bir potasyumlu gübre",
    notes: "Sıcak ortamı sever",
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
