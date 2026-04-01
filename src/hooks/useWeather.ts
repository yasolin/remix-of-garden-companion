import { useState, useEffect } from "react";

export interface WeatherData {
  temp: number;
  condition: string;
  wind: number;
  sunrise: string;
  sunset: string;
  humidity: number;
  city?: string;
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

        // Fetch weather + reverse geocode city
        const [weatherResp, geoResp] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=sunrise,sunset&timezone=auto`),
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
        });
      } catch {
        setWeather({ temp: 22, condition: "🌤️", wind: 8, sunrise: "06:15", sunset: "19:30", humidity: 55 });
      }
      setLoading(false);
    };
    fetchWeather();
  }, []);

  return { weather, loading };
}
