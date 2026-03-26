import { ArrowLeft, Compass, Sun, Wind, MapPin, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";

const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
const dirLabels: Record<string, Record<string, string>> = {
  tr: { N: "Kuzey", NE: "Kuzeydoğu", E: "Doğu", SE: "Güneydoğu", S: "Güney", SW: "Güneybatı", W: "Batı", NW: "Kuzeybatı" },
  en: { N: "North", NE: "Northeast", E: "East", SE: "Southeast", S: "South", SW: "Southwest", W: "West", NW: "Northwest" },
};

const countries: Record<string, { label: Record<string, string>; states: Record<string, string>[] }> = {
  TR: {
    label: { tr: "Türkiye", en: "Turkey" },
    states: [
      { tr: "İstanbul", en: "Istanbul" }, { tr: "Ankara", en: "Ankara" }, { tr: "İzmir", en: "Izmir" },
      { tr: "Antalya", en: "Antalya" }, { tr: "Bursa", en: "Bursa" }, { tr: "Adana", en: "Adana" },
      { tr: "Trabzon", en: "Trabzon" }, { tr: "Konya", en: "Konya" }, { tr: "Gaziantep", en: "Gaziantep" },
      { tr: "Diyarbakır", en: "Diyarbakir" }, { tr: "Mersin", en: "Mersin" }, { tr: "Eskişehir", en: "Eskisehir" },
    ],
  },
  US: {
    label: { tr: "Amerika Birleşik Devletleri", en: "United States" },
    states: [
      { tr: "Kaliforniya", en: "California" }, { tr: "Teksas", en: "Texas" }, { tr: "Florida", en: "Florida" },
      { tr: "New York", en: "New York" }, { tr: "İllinois", en: "Illinois" }, { tr: "Washington", en: "Washington" },
    ],
  },
  DE: {
    label: { tr: "Almanya", en: "Germany" },
    states: [
      { tr: "Berlin", en: "Berlin" }, { tr: "Münih", en: "Munich" }, { tr: "Hamburg", en: "Hamburg" },
      { tr: "Frankfurt", en: "Frankfurt" }, { tr: "Köln", en: "Cologne" },
    ],
  },
  GB: {
    label: { tr: "İngiltere", en: "United Kingdom" },
    states: [
      { tr: "Londra", en: "London" }, { tr: "Manchester", en: "Manchester" }, { tr: "Birmingham", en: "Birmingham" },
      { tr: "Edinburgh", en: "Edinburgh" },
    ],
  },
};

const LocationAnalysisPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "tr";

  const [heading, setHeading] = useState<number | null>(null);
  const [manualDir, setManualDir] = useState<string>("N");
  const [useManual, setUseManual] = useState(false);
  const [sunrise, setSunrise] = useState("06:30");
  const [sunset, setSunset] = useState("19:45");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [compassError, setCompassError] = useState(false);

  const requestCompass = useCallback(() => {
    if ("DeviceOrientationEvent" in window && typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          } else {
            setCompassError(true);
            setUseManual(true);
          }
        })
        .catch(() => {
          setCompassError(true);
          setUseManual(true);
        });
    } else if ("DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", handleOrientation);
      // Check after a short delay if we got any readings
      setTimeout(() => {
        if (heading === null) setCompassError(true);
      }, 2000);
    } else {
      setCompassError(true);
      setUseManual(true);
    }
  }, []);

  const handleOrientation = (e: DeviceOrientationEvent) => {
    if (e.alpha !== null) {
      setHeading(Math.round(e.alpha));
      setCompassError(false);
    }
  };

  useEffect(() => {
    requestCompass();
    return () => window.removeEventListener("deviceorientation", handleOrientation);
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

  const statesForCountry = selectedCountry ? countries[selectedCountry]?.states || [] : [];

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
              <Compass className="w-12 h-12 text-primary mx-auto" style={{ transform: `rotate(${360 - heading}deg)` }} />
              <p className="text-2xl font-bold text-foreground mt-2">{heading}°</p>
              <p className="text-sm font-semibold text-primary">{dirLabel}</p>
            </div>
          ) : useManual ? (
            <div className="text-center">
              <Compass className="w-12 h-12 text-primary mx-auto" />
              <p className="text-sm font-semibold text-primary mt-2">{dirLabels[lang][manualDir]}</p>
            </div>
          ) : (
            <div className="text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">{t("location.noCompass")}</p>
            </div>
          )}
        </motion.div>

        <button onClick={() => { setUseManual(!useManual); if (!useManual) setCompassError(false); }}
          className="mt-4 text-sm font-semibold text-primary underline">
          {useManual ? t("location.useCompass") : t("location.useManual")}
        </button>
      </div>

      {/* Manual direction picker + country/state */}
      {useManual && (
        <div className="px-4 mt-4 space-y-4">
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

          {/* Country selector */}
          <div className="bg-card rounded-xl p-4 border border-border space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">{t("location.country")}</span>
            </div>
            <select value={selectedCountry} onChange={e => { setSelectedCountry(e.target.value); setSelectedState(""); }}
              className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground outline-none">
              <option value="">{t("location.selectCountry")}</option>
              {Object.entries(countries).map(([code, c]) => (
                <option key={code} value={code}>{c.label[lang]}</option>
              ))}
            </select>
            {selectedCountry && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">{t("location.state")}</span>
                </div>
                <select value={selectedState} onChange={e => setSelectedState(e.target.value)}
                  className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground outline-none">
                  <option value="">{t("location.selectState")}</option>
                  {statesForCountry.map((s, i) => (
                    <option key={i} value={s[lang]}>{s[lang]}</option>
                  ))}
                </select>
              </>
            )}
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
