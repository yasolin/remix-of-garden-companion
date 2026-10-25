export type AppTheme = "green" | "light" | "dark";

export function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  localStorage.setItem("gardenPotTheme", theme);
}