import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { applyTheme, type AppTheme } from "@/lib/theme";

const root = document.documentElement;
applyTheme((localStorage.getItem("gardenPotTheme") || "green") as AppTheme);

// Apply saved font size
const savedFontSize = localStorage.getItem("gardenPotFontSize") || "medium";
const sizes: Record<string, string> = { small: "14px", medium: "16px", large: "18px" };
root.style.fontSize = sizes[savedFontSize] || "16px";

const container = document.getElementById("root");
if (container) createRoot(container).render(<App />);
