import { useEffect, useMemo, useState } from "react";
import { BellRing, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { alertPool, weatherAlert, type SmartAlert } from "@/lib/tips";
import type { FarmKind } from "@/lib/farm";
import type { WeatherState } from "@/lib/weather";

const ROTATE_MS = 12000;

export function DailyAlertBanner({
  kind = "mixed",
  online = false,
  weather = null,
}: {
  kind?: FarmKind;
  online?: boolean;
  weather?: WeatherState | null;
}) {
  const pool = useMemo<SmartAlert[]>(() => {
    const month = new Date().getMonth() + 1;
    const list = alertPool(kind, month);
    const live = online && weather ? weatherAlert(kind, weather) : null;
    return live ? [live, ...list] : list;
  }, [kind, online, weather]);

  // بذرة تتغير مع كل تحميل للصفحة حتى يبدأ التنبيه من موضع مختلف
  const [seed] = useState(() => Math.floor(Math.random() * 1000));
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const id = window.setInterval(() => setStep((s) => s + 1), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [pool.length]);

  const index = (seed + step) % pool.length;
  const alert = pool[index]!;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-goldish/15 px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-goldish text-accent-foreground">
        <BellRing className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-xs font-bold text-primary">
            {alert.emoji} تنبيه ذكي · {alert.title}
          </p>
          <span
            className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              alert.live ? "bg-leaf/15 text-leaf" : "bg-secondary text-muted-foreground"
            }`}
          >
            {alert.live ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {alert.live ? "مباشر" : "بدون إنترنت"}
          </span>
        </div>
        <p key={index} className="animate-rise mt-1 text-xs leading-relaxed text-foreground/85">
          {alert.body}
        </p>
        <button
          onClick={() => setStep((s) => s + 1)}
          className="mt-2 flex items-center gap-1 text-[10px] font-bold text-gold active:scale-95"
        >
          <RefreshCw className="h-3 w-3" /> تنبيه آخر
        </button>
      </div>
    </div>
  );
}
