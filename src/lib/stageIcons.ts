import {
  Sprout,
  Leaf,
  Flower2,
  Flower,
  Bug,
  Apple,
  Cherry,
  Grape,
  Carrot,
  Wheat,
  Trees,
  TreePine,
  TreePalm,
  Scissors,
  Moon,
  Package,
  Droplets,
  CircleDot,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * Consistent Lucide icon per lifecycle stage — replaces emoji usage so
 * cards and timelines read as a professional, uniform icon set.
 */
const STAGE_ICONS: Record<string, LucideIcon> = {
  seedSowing: Sprout,
  planted: Sprout,
  seed: Sprout,
  tuberPlanting: Sprout,
  bulbPlanting: Sprout,
  cactSeedCut: Sprout,
  cuttingOrSeed: Scissors,
  cutting: Scissors,
  myceliumSow: CircleDot,

  germination: Sprout,
  sprouting: Sprout,
  rooting: Sprout,
  budBreak: Sprout,
  newShoot: Sprout,
  regrowth: Sprout,
  yearRegrowth: Sprout,
  seedling: Sprout,
  youngSeedling: Sprout,
  offsets: Sprout,
  propagate: Scissors,
  callus: CircleDot,
  myceliumGrow: CircleDot,

  vegetative: Leaf,
  growing: Leaf,
  leafGrowth: Leaf,
  leafEmergence: Leaf,
  leafing: Leaf,
  newLeaves: Leaf,
  shootGrowth: Leaf,
  stemElongation: Leaf,
  stemGrowth: Leaf,
  rosetteGrowth: Leaf,
  ribSegment: Leaf,
  sideShoots: Leaf,
  tillering: Wheat,
  youngFern: Leaf,
  matureHousePlant: Leaf,
  trunkThicken: Trees,
  matureTree: Trees,
  youngTree: TreePine,
  primordia: CircleDot,
  mushroomGrow: CircleDot,
  nextFlush: CircleDot,

  budding: Flower2,
  budSwelling: Flower2,
  flowerBud: Flower2,
  clusterFormation: Grape,

  flowering: Flower,
  succFlower: Flower,
  cactFlower: Flower,

  pollination: Bug,

  fruitSet: Cherry,
  producing: Cherry,
  podFormation: Cherry,
  fruitGrowth: Apple,
  fruitOptional: Cherry,
  coneFormation: TreePine,
  tuberFormation: Carrot,
  tuberGrowth: Carrot,
  rootThickening: Carrot,
  bulbGrowth: CircleDot,
  grainFilling: Wheat,
  seedDevelop: Wheat,
  headingSpike: Wheat,

  ripening: Apple,
  seedRipening: Wheat,

  harvest: Package,
  harvestReady: Package,

  propagatable: Wheat,
  seedFormation: Wheat,
  seedProduction: Wheat,
  sporeFormation: Sparkles,
  sporeSpread: Sparkles,

  dormancy: Moon,
  dormant: Moon,
  restingPeriod: Moon,
  leafFall: Leaf,
  endOfLife: Leaf,
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  fruitingVegetable: Cherry,
  leafyVegetable: Leaf,
  rootVegetable: Carrot,
  tuber: Carrot,
  bulb: CircleDot,
  legume: Cherry,
  grain: Wheat,
  deciduousFruitTree: Apple,
  citrus: Apple,
  grapevine: Grape,
  annualFlower: Flower,
  perennialFlower: Flower2,
  succulent: Leaf,
  cactus: Leaf,
  foliageHousePlant: Leaf,
  fern: Leaf,
  palm: TreePalm,
  conifer: TreePine,
  herb: Leaf,
  mushroom: CircleDot,
  generic: Sprout,
};

export function stageIcon(key: string): LucideIcon {
  return STAGE_ICONS[key] ?? Leaf;
}

export function categoryIcon(key?: string | null): LucideIcon {
  return (key && CATEGORY_ICONS[key]) || Sprout;
}

export const WaterIcon = Droplets;
