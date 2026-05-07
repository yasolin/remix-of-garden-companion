// Comprehensive bilingual plant catalog used across the app for
// autocomplete, validation, and the planting calendar.

export const plantCatalog: string[] = [
  // Vegetables
  "Domates","Tomato","Kiraz Domates","Cherry Tomato","Biber","Pepper","Acı Biber","Chili Pepper",
  "Dolmalık Biber","Bell Pepper","Patlıcan","Eggplant","Salatalık","Cucumber","Kabak","Squash",
  "Bal Kabağı","Pumpkin","Karpuz","Watermelon","Kavun","Melon","Fasulye","Bean","Bezelye","Pea",
  "Bakla","Fava Bean","Mısır","Corn","Bamya","Okra","Enginar","Artichoke","Kuşkonmaz","Asparagus",
  "Marul","Lettuce","Iceberg","Roka","Arugula","Tere","Cress","Ispanak","Spinach","Pazı","Chard",
  "Lahana","Cabbage","Brokoli","Broccoli","Karnabahar","Cauliflower","Brüksel Lahanası","Brussels Sprout",
  "Havuç","Carrot","Turp","Radish","Pancar","Beetroot","Şalgam","Turnip","Sarımsak","Garlic",
  "Soğan","Onion","Pırasa","Leek","Yeşil Soğan","Spring Onion","Patates","Potato","Tatlı Patates","Sweet Potato",
  "Zencefil","Ginger","Zerdeçal","Turmeric","Mantar","Mushroom",
  // Herbs
  "Nane","Mint","Fesleğen","Basil","Limon Fesleğeni","Lemon Basil","Maydanoz","Parsley",
  "Kekik","Thyme","Biberiye","Rosemary","Adaçayı","Sage","Reyhan","Sweet Basil",
  "Lavanta","Lavender","Melisa","Lemon Balm","Kişniş","Cilantro","Coriander","Dereotu","Dill",
  "Tarhun","Tarragon","Mercanköşk","Marjoram","Oregano","Rezene","Fennel","Civanperçemi","Yarrow",
  "Papatya","Chamomile","Ekinezya","Echinacea","Aloe Vera","Stevya","Stevia",
  // Fruits / berries
  "Çilek","Strawberry","Ahududu","Raspberry","Böğürtlen","Blackberry","Yaban Mersini","Blueberry",
  "Üzüm","Grape","İncir","Fig","Limon","Lemon","Portakal","Orange","Mandalina","Mandarin",
  "Greyfurt","Grapefruit","Elma","Apple","Armut","Pear","Şeftali","Peach","Kayısı","Apricot",
  "Erik","Plum","Kiraz","Cherry","Vişne","Sour Cherry","Nar","Pomegranate","Avokado","Avocado",
  "Muz","Banana","Ananas","Pineapple","Kivi","Kiwi","Hindistan Cevizi","Coconut",
  // Flowers / ornamentals
  "Sardunya","Geranium","Menekşe","Violet","Afrika Menekşesi","African Violet","Gül","Rose",
  "Karanfil","Carnation","Papatya","Daisy","Ayçiçeği","Sunflower","Begonya","Begonia",
  "Petunya","Petunia","Sümbül","Hyacinth","Lale","Tulip","Zambak","Lily","Glayöl","Gladiolus",
  "Ortanca","Hydrangea","Yıldız Çiçeği","Aster","Krizantem","Chrysanthemum","Dahlia","Yıldız",
  "Çuha Çiçeği","Primrose","Manolya","Magnolia","Camelya","Camellia","Yasemin","Jasmine",
  "Hanımeli","Honeysuckle","Akasya","Acacia","Mor Salkım","Wisteria","Sarmaşık","Ivy",
  // Houseplants / succulents
  "Kaktüs","Cactus","Sukulent","Succulent","Echeveria","Haworthia","Sedum","Damkoruğu",
  "Yılan Bitkisi","Snake Plant","Sansevieria","Zamioculcas","ZZ Plant","Pothos","Salon Sarmaşığı",
  "Monstera","Ficus","Kauçuk Ağacı","Rubber Plant","Filodendron","Philodendron","Yucca",
  "Dracena","Dracaena","Spatifilyum","Peace Lily","Antoryum","Anthurium","Orkide","Orchid",
  "Phalaenopsis","Bonsai","Palmiye","Palm","Areka","Areca","Calathea","Maranta",
  "Begonya Rex","Rex Begonia","Aglaonema","Difenbahya","Dieffenbachia","Croton","Hibiscus","Bambu","Bamboo",
];

export function isValidPlantName(s: string): boolean {
  const trimmed = s.trim();
  if (trimmed.length < 2) return false;
  return /^[a-zA-ZçğıöşüÇĞİÖŞÜ\s-']+$/.test(trimmed);
}

export function isKnownPlantName(s: string): boolean {
  const t = s.trim().toLowerCase();
  return plantCatalog.some(p => p.toLowerCase() === t);
}
