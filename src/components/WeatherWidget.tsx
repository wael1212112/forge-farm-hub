import { CloudSun, WifiOff } from "lucide-react";
import type { WeatherState } from "@/lib/weather";

const arNum = (n: number) => n.toLocaleString("ar-EG");

const relative = (at: number) => {
  const mins = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (mins < 60) return `قبل ${arNum(mins)} دقيقة`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `قبل ${arNum(hours)} ساعة`;
  return `قبل ${arNum(Math.round(hours / 24))} يوم`;
};

export function WeatherWidget({
  weather,
  cached,
  label,
}: {
  weather: WeatherState | null;
  cached: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 bg-forest px-5 py-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-foreground/10">
        <CloudSun className="h-7 w-7 text-gold" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs text-primary-foreground/60">{label}</p>
          {cached && (
            <span className="flex items-center gap-1 rounded-full bg-primary-foreground/10 px-2 py-0.5 text-[10px] font-bold text-primary-foreground/70">
              <WifiOff className="h-3 w-3" /> غير متصل
            </span>
          )}
        </div>
        {weather ? (
          <>
            <p className="truncate text-lg font-bold text-primary-foreground">
              {arNum(weather.temp)}° · {weather.label} {weather.emoji}
            </p>
            <p className="mt-0.5 text-[10px] text-primary-foreground/50">
              {weather.city} · {cached ? `آخر تحديث ${relative(weather.at)}` : "محدّث الآن"}
            </p>
          </>
        ) : (
          <p className="text-sm font-semibold text-primary-foreground/80">
            {cached ? "لا توجد بيانات محفوظة" : "جاري تحديد حالة الطقس…"}
          </p>
        )}
      </div>
    </div>
  );
}
