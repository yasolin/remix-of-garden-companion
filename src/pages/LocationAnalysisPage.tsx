import { ArrowLeft, Compass, Sun, Wind, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
const dirLabels: Record<string, Record<string, string>> = {
  tr: { N: "Kuzey", NE: "Kuzeydoğu", E: "Doğu", SE: "Güneydoğu", S: "Güney", SW: "Güneybatı", W: "Batı", NW: "Kuzeybatı" },
  en: { N: "North", NE: "Northeast", E: "East", SE: "Southeast", S: "South", SW: "Southwest", W: "West", NW: "Northwest" },
};

const LocationAnalysisPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "tr" ? "tr" : "en";

  const [heading, setHeading] = useState<number | null>(null);
  const [manualDir, setManualDir] = useState<string>("N");
  const [useManual, setUseManual] = useState(false);
  const [sunrise, setSunrise] = useState("06:30");
  const [sunset, setSunset] = useState("19:45");

  useEffect(() => {
    if ("DeviceOrientationEvent" in window) {
      const handler = (e: DeviceOrientationEvent) => {
        if (e.alpha !== null) setHeading(Math.round(e.alpha));
      };
      window.addEventListener("deviceorientation", handler);
      return () => window.removeEventListener("deviceorientation", handler);
    }
  }, []);

  const getDirection = (deg: number): string => {
    const idx = Math.round(deg / 45) % 8;
    return directions[idx];
  };

  const currentDir = useManual ? manualDir : (heading !== null ? getDirection(heading) : null);
  const dirLabel = currentDir ? (dirLabels[lang][currentDir] || currentDir) : null;

  const getSunExposure = (dir: string): string => {
    const exposures: Record<string, Record<string, string>> = {
      tr: { N: "Düşük güneş, gölge sever bitkiler için ideal", S: "Tam güneş, sıcak seven bitkiler için mükemmel", E: "Sabah güneşi alır, öğleden sonra gölge", W: "Öğleden sonra güneşi alır", NE: "Sabah erken güneş, genelde serin", SE: "İyi sabah güneşi", NW: "Sınırlı güneş, genelde gölge", SW: "Güçlü öğleden sonra güneşi" },
      en: { N: "Low sun, ideal for shade-loving plants", S: "Full sun, perfect for heat-loving plants", E: "Morning sun, afternoon shade", W: "Afternoon sun exposure", NE: "Early morning sun, generally cool", SE: "Good morning sun", NW: "Limited sun, mostly shade", SW: "Strong afternoon sun" },
    };
    return exposures[lang][dir] || "";
  };

  const getWindInfo = (dir: string): string => {
    const info: Record<string, Record<string, string>> = {
      tr: { N: "Kuzey rüzgarı: soğuk ve kuru", S: "Güney rüzgarı: sıcak ve nemli", E: "Doğu rüzgarı: genelde hafif", W: "Batı rüzgarı: yağmur getirici", NE: "Kuzeydoğu: soğuk rüzgar", SE: "Güneydoğu: ılık esinti", NW: "Kuzeybatı: serin ve kuvvetli", SW: "Güneybatı: ılık rüzgar" },
      en: { N: "North wind: cold and dry", S: "South wind: warm and humid", E: "East wind: generally mild", W: "West wind: rain-bearing", NE: "Northeast: cold wind", SE: "Southeast: warm breeze", NW: "Northwest: cool and strong", SW: "Southwest: warm wind" },
    };
    return info[lang][dir] || "";
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("location.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("location.subtitle")}</p>
        </div>
      </div>

      {/* Compass */}
      <div className="px-4 mt-6 flex flex-col items-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-40 h-40 rounded-full border-4 border-primary/30 bg-card shadow-card flex items-center justify-center relative">
          {heading !== null && !useManual ? (
            <div className="text-center">
              <Compass className="w-12 h-12 text-primary mx-auto" style={{ transform: `rotate(${heading}deg)` }} />
              <p className="text-2xl font-bold text-foreground mt-2">{heading}°</p>
              <p className="text-sm font-semibold text-primary">{dirLabel}</p>
            </div>
          ) : (
            <div className="text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">{t("location.noCompass")}</p>
            </div>
          )}
        </motion.div>

        {/* Manual toggle */}
        <button onClick={() => setUseManual(!useManual)}
          className="mt-4 text-sm font-semibold text-primary underline">
          {useManual ? t("location.useCompass") : t("location.useManual")}
        </button>
      </div>

      {/* Manual direction picker */}
      {useManual && (
        <div className="px-4 mt-4">
          <div className="grid grid-cols-4 gap-2">
            {directions.map(dir => (
              <button key={dir} onClick={() => setManualDir(dir)}
                className={`py-2 rounded-xl text-sm font-bold transition-colors ${
                  manualDir === dir ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}>
                {dirLabels[lang][dir]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analysis results */}
      {currentDir && (
        <div className="px-4 mt-6 space-y-3">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Sun className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-foreground">{t("location.sunExposure")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{getSunExposure(currentDir)}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-4 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Wind className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-bold text-foreground">{t("location.windDirection")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{getWindInfo(currentDir)}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-4 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Sun className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">{t("location.sunTimes")}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">{t("location.sunrise")}</label>
                <input type="time" value={sunrise} onChange={e => setSunrise(e.target.value)}
                  className="w-full mt-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">{t("location.sunset")}</label>
                <input type="time" value={sunset} onChange={e => setSunset(e.target.value)}
                  className="w-full mt-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LocationAnalysisPage;
