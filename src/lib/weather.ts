import { useEffect, useState } from "react";

/** حالة الطقس — تُجلب مباشرة عند الاتصال وتُخزَّن محلياً للعمل بدون إنترنت. */
export type WeatherState = {
  temp: number;
  code: number;
  label: string;
  emoji: string;
  city: string;
  at: number; // timestamp
};

const CACHE_KEY = "agripulse_weather_cache";
/** دمشق افتراضياً عند تعذّر تحديد الموقع */
const FALLBACK = { lat: 33.5138, lon: 36.2765, city: "دمشق" };

const codes: Record<number, { label: string; emoji: string }> = {
  0: { label: "صافٍ", emoji: "☀️" },
  1: { label: "صافٍ غالباً", emoji: "🌤️" },
  2: { label: "مشمس جزئياً", emoji: "⛅" },
  3: { label: "غائم", emoji: "☁️" },
  45: { label: "ضباب", emoji: "🌫️" },
  48: { label: "ضباب متجمد", emoji: "🌫️" },
  51: { label: "رشّ خفيف", emoji: "🌦️" },
  53: { label: "رشّ متوسط", emoji: "🌦️" },
  55: { label: "رشّ كثيف", emoji: "🌦️" },
  61: { label: "مطر خفيف", emoji: "🌧️" },
  63: { label: "مطر متوسط", emoji: "🌧️" },
  65: { label: "مطر غزير", emoji: "🌧️" },
  71: { label: "ثلج خفيف", emoji: "🌨️" },
  73: { label: "ثلج", emoji: "🌨️" },
  75: { label: "ثلج غزير", emoji: "❄️" },
  80: { label: "زخّات مطر", emoji: "🌦️" },
  81: { label: "زخّات قوية", emoji: "🌧️" },
  95: { label: "عواصف رعدية", emoji: "⛈️" },
  96: { label: "رعد وبرد", emoji: "⛈️" },
};

export const describeCode = (code: number) =>
  codes[code] ?? { label: "حالة مستقرة", emoji: "🌤️" };

function readCache(): WeatherState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as WeatherState) : null;
  } catch {
    return null;
  }
}

function writeCache(state: WeatherState) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    /* تجاهل */
  }
}

async function locate(): Promise<{ lat: number; lon: number; city: string }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return FALLBACK;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(FALLBACK), 4000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, city: "موقعك" });
      },
      () => {
        window.clearTimeout(timer);
        resolve(FALLBACK);
      },
      { timeout: 4000, maximumAge: 30 * 60 * 1000 },
    );
  });
}

async function fetchWeather(): Promise<WeatherState | null> {
  try {
    const { lat, lon, city } = await locate();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const temp = json.current?.temperature_2m;
    const code = json.current?.weather_code ?? 2;
    if (typeof temp !== "number") return null;
    const meta = describeCode(code);
    return { temp: Math.round(temp), code, city, at: Date.now(), ...meta };
  } catch {
    return null;
  }
}

/**
 * يعيد آخر حالة طقس معروفة + هل هي مخزّنة محلياً (أوفلاين).
 */
export function useWeather(online: boolean) {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    setWeather(readCache());
  }, []);

  useEffect(() => {
    if (!online) {
      setFresh(false);
      return;
    }
    let cancelled = false;
    void fetchWeather().then((next) => {
      if (cancelled || !next) return;
      writeCache(next);
      setWeather(next);
      setFresh(true);
    });
    return () => {
      cancelled = true;
    };
  }, [online]);

  return { weather, fresh, cached: !!weather && !fresh };
}
