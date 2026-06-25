import { useState, useEffect } from "react";

export interface WeatherAlert {
  key: "uv" | "storm" | "rain" | "flood" | "wind" | "pollen";
  level: "info" | "warning" | "danger";
  icon: string;
  titleTr: string;
  titleEn: string;
  bodyTr: string;
  bodyEn: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  wind: number;
  sunrise: string;
  sunset: string;
  humidity: number;
  city?: string;
  weatherCode?: number;
  uvIndex?: number;
  precipitation?: number;
  alerts?: WeatherAlert[];
}

function buildAlerts(d: any): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const uv = d.daily?.uv_index_max?.[0] ?? d.current?.uv_index ?? 0;
  const code = d.current?.weather_code ?? 0;
  const wind = d.current?.wind_speed_10m ?? 0;
  const precip = d.daily?.precipitation_sum?.[0] ?? 0;
  const humidity = d.current?.relative_humidity_2m ?? 50;
  const temp = d.current?.temperature_2m ?? 20;

  if (uv >= 8) {
    alerts.push({
      key: "uv", level: "danger", icon: "☀️",
      titleTr: "Yüksek UV Uyarısı", titleEn: "High UV Alert",
      bodyTr: `UV indeksi ${Math.round(uv)}. Hassas bitkileri gölgeye alın, gün ortasında sulamayın.`,
      bodyEn: `UV index ${Math.round(uv)}. Move sensitive plants to shade, avoid midday watering.`,
    });
  } else if (uv >= 6) {
    alerts.push({
      key: "uv", level: "warning", icon: "🌞",
      titleTr: "Yüksek UV", titleEn: "Elevated UV",
      bodyTr: `UV indeksi ${Math.round(uv)}. Genç fideleri koruyun.`,
      bodyEn: `UV index ${Math.round(uv)}. Protect young seedlings.`,
    });
  }

  if ([95, 96, 99].includes(code)) {
    alerts.push({
      key: "storm", level: "danger", icon: "⛈️",
      titleTr: "Fırtına Riski", titleEn: "Storm Risk",
      bodyTr: "Saksıları içeri alın, kazıkla destekleyin.",
      bodyEn: "Bring pots inside, stake tall plants.",
    });
  }

  if (precip >= 30) {
    alerts.push({
      key: "flood", level: "danger", icon: "🌊",
      titleTr: "Sel/Aşırı Yağış Riski", titleEn: "Flood / Heavy Rain Risk",
      bodyTr: `${Math.round(precip)} mm yağış bekleniyor. Drenajı kontrol edin.`,
      bodyEn: `${Math.round(precip)} mm rain expected. Check drainage.`,
    });
  } else if (precip >= 10) {
    alerts.push({
      key: "rain", level: "info", icon: "🌧️",
      titleTr: "Yağış Bekleniyor", titleEn: "Rain Expected",
      bodyTr: "Bugün ek sulamaya gerek yok.",
      bodyEn: "Skip extra watering today.",
    });
  }

  if (wind >= 40) {
    alerts.push({
      key: "wind", level: "warning", icon: "💨",
      titleTr: "Kuvvetli Rüzgar", titleEn: "Strong Wind",
      bodyTr: `${Math.round(wind)} km/s. Uzun bitkileri destekleyin.`,
      bodyEn: `${Math.round(wind)} km/h. Support tall plants.`,
    });
  }

  // Heuristic pollination/pollen advice (warm, low humidity, low wind, sunny)
  if (temp >= 18 && temp <= 28 && humidity >= 40 && humidity <= 75 && wind < 25 && code <= 2) {
    alerts.push({
      key: "pollen", level: "info", icon: "🐝",
      titleTr: "Tozlaşma için İdeal", titleEn: "Ideal for Pollination",
      bodyTr: "Çiçekli bitkilerinizi dışarı alın, polinatörler aktif.",
      bodyEn: "Move flowering plants outside — pollinators active.",
    });
  }

  return alerts;
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
        );
        const { latitude, longitude } = pos.coords;

        const [weatherResp, geoResp] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,uv_index&daily=sunrise,sunset,uv_index_max,precipitation_sum&timezone=auto`),
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=tr`).catch(() => null),
        ]);

        const data = await weatherResp.json();
        let city = "";
        if (geoResp?.ok) {
          const geo = await geoResp.json();
          city = geo.address?.city || geo.address?.town || geo.address?.province || geo.address?.state || "";
        }

        const codes: Record<number, string> = { 0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 51: "🌦️", 61: "🌧️", 71: "🌨️", 80: "🌧️", 95: "⛈️" };
        const code = data.current?.weather_code ?? 0;
        const icon = codes[code] || codes[Math.floor(code / 10) * 10] || "🌤️";

        setWeather({
          temp: Math.round(data.current?.temperature_2m ?? 0),
          condition: icon,
          wind: Math.round(data.current?.wind_speed_10m ?? 0),
          sunrise: data.daily?.sunrise?.[0]?.slice(11, 16) || "06:00",
          sunset: data.daily?.sunset?.[0]?.slice(11, 16) || "19:00",
          humidity: data.current?.relative_humidity_2m ?? 50,
          city,
          weatherCode: code,
          uvIndex: Math.round(data.daily?.uv_index_max?.[0] ?? data.current?.uv_index ?? 0),
          precipitation: Math.round(data.daily?.precipitation_sum?.[0] ?? 0),
          alerts: buildAlerts(data),
        });
      } catch {
        setWeather({ temp: 22, condition: "🌤️", wind: 8, sunrise: "06:15", sunset: "19:30", humidity: 55, alerts: [] });
      }
      setLoading(false);
    };
    fetchWeather();
  }, []);

  return { weather, loading };
}
