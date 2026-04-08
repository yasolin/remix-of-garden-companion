import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme on load
const savedTheme = localStorage.getItem("gardenPotTheme") || "green";
const root = document.documentElement;
if (savedTheme === "dark") {
  root.style.setProperty("--background", "220 15% 10%");
  root.style.setProperty("--foreground", "0 0% 95%");
  root.style.setProperty("--card", "220 15% 13%");
  root.style.setProperty("--card-foreground", "0 0% 95%");
  root.style.setProperty("--secondary", "220 10% 18%");
  root.style.setProperty("--secondary-foreground", "0 0% 90%");
  root.style.setProperty("--muted", "220 10% 20%");
  root.style.setProperty("--muted-foreground", "220 10% 60%");
  root.style.setProperty("--border", "220 10% 20%");
  root.style.setProperty("--input", "220 10% 20%");
} else if (savedTheme === "light") {
  root.style.setProperty("--background", "0 0% 100%");
  root.style.setProperty("--foreground", "220 15% 15%");
  root.style.setProperty("--card", "0 0% 100%");
  root.style.setProperty("--card-foreground", "220 15% 15%");
  root.style.setProperty("--secondary", "220 10% 96%");
  root.style.setProperty("--secondary-foreground", "220 15% 20%");
  root.style.setProperty("--muted", "220 10% 95%");
  root.style.setProperty("--muted-foreground", "220 10% 45%");
  root.style.setProperty("--border", "220 10% 92%");
  root.style.setProperty("--input", "220 10% 92%");
}

// Apply saved font size
const savedFontSize = localStorage.getItem("gardenPotFontSize") || "medium";
const sizes: Record<string, string> = { small: "14px", medium: "16px", large: "18px" };
root.style.fontSize = sizes[savedFontSize] || "16px";

createRoot(document.getElementById("root")!).render(<App />);
