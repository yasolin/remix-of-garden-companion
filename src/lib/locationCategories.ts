export const LOCATION_CATEGORIES = ["balcony", "livingRoom", "indoor", "garden", "window", "greenhouse", "other"];
export function inferLocationCategory(name: string): string {
  const value = name.toLocaleLowerCase("tr");
  if (/balkon|balcony|teras|terrace/.test(value)) return "balcony";
  if (/salon|living/.test(value)) return "livingRoom";
  if (/bahçe|garden/.test(value)) return "garden";
  if (/pencere|window/.test(value)) return "window";
  if (/sera|greenhouse/.test(value)) return "greenhouse";
  return "indoor";
}
export function locationCategoryLabel(key: string, lang: string) {
  const names: Record<string, [string, string]> = { balcony: ["Balkon / Teras", "Balcony / Terrace"], livingRoom: ["Salon", "Living room"], indoor: ["İç mekan", "Indoors"], garden: ["Bahçe", "Garden"], window: ["Pencere önü", "Windowsill"], greenhouse: ["Sera", "Greenhouse"], other: ["Diğer", "Other"] };
  return names[key]?.[lang.startsWith("tr") ? 0 : 1] ?? key;
}