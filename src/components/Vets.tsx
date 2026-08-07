import { useMemo, useState } from "react";
import { Search, Stethoscope, Phone, Copy } from "lucide-react";
import { toast } from "sonner";
import { vetMatchesKind, type FarmKind } from "@/lib/farm";

export type Vet = {
  id: string;
  name: string;
  gov: string;
  city: string;
  specialty: string;
  phone: string;
};

export const governorates = [
  "دمشق",
  "ريف دمشق",
  "حلب",
  "حمص",
  "حماة",
  "اللاذقية",
  "طرطوس",
  "إدلب",
  "دير الزور",
  "الحسكة",
  "الرقة",
  "درعا",
  "السويداء",
  "القنيطرة",
];

export const vets: Vet[] = [
  { id: "v1", name: "د. سامر الحلبي", gov: "دمشق", city: "المزة", specialty: "دواجن وأمراض الطيور", phone: "0991234501" },
  { id: "v2", name: "د. ليلى خضر", gov: "دمشق", city: "برزة", specialty: "حيوانات صغيرة وتلقيح", phone: "0991234502" },
  { id: "v3", name: "د. عمار السباعي", gov: "ريف دمشق", city: "قطنا", specialty: "أغنام وماعز", phone: "0991234503" },
  { id: "v4", name: "د. محمد نور العلي", gov: "حلب", city: "الفرقان", specialty: "أبقار وتوليد", phone: "0991234504" },
  { id: "v5", name: "د. رهام قدور", gov: "حلب", city: "السريان", specialty: "دواجن وتحصين", phone: "0991234505" },
  { id: "v6", name: "د. باسل الدروبي", gov: "حمص", city: "الوعر", specialty: "أمراض باطنة للمواشي", phone: "0991234506" },
  { id: "v7", name: "د. فادي الأتاسي", gov: "حمص", city: "الإنشاءات", specialty: "جراحة بيطرية", phone: "0991234507" },
  { id: "v8", name: "د. أحمد الكيلاني", gov: "حماة", city: "المحطة", specialty: "أبقار حلوب وضرع", phone: "0991234508" },
  { id: "v9", name: "د. ريم شحادة", gov: "اللاذقية", city: "الأزهري", specialty: "دواجن وأسماك", phone: "0991234509" },
  { id: "v10", name: "د. وسيم صقر", gov: "اللاذقية", city: "جبلة", specialty: "أغنام وتغذية", phone: "0991234510" },
  { id: "v11", name: "د. جورج نصر", gov: "طرطوس", city: "الشيخ سعد", specialty: "حيوانات مزرعة عامة", phone: "0991234511" },
  { id: "v12", name: "د. خالد المصري", gov: "إدلب", city: "معرة مصرين", specialty: "دواجن ومباشر حقلي", phone: "0991234512" },
  { id: "v13", name: "د. نصر العبد", gov: "دير الزور", city: "الميادين", specialty: "أغنام وإبل", phone: "0991234513" },
  { id: "v14", name: "د. آلان حسو", gov: "الحسكة", city: "القامشلي", specialty: "أبقار وأمراض معدية", phone: "0991234514" },
  { id: "v15", name: "د. سعد الجاسم", gov: "الرقة", city: "مركز الرقة", specialty: "دواجن ومواشي", phone: "0991234515" },
  { id: "v16", name: "د. ماهر الحوراني", gov: "درعا", city: "إزرع", specialty: "أبقار وتلقيح صناعي", phone: "0991234516" },
  { id: "v17", name: "د. نبيل عامر", gov: "السويداء", city: "شهبا", specialty: "أغنام وماعز", phone: "0991234517" },
  { id: "v18", name: "د. زياد الخطيب", gov: "القنيطرة", city: "خان أرنبة", specialty: "حيوانات مزرعة عامة", phone: "0991234518" },
];

export function Vets({
  onWebSearch,
  farmKind = "mixed",
}: {
  onWebSearch: (q: string) => void;
  farmKind?: FarmKind;
}) {
  const [query, setQuery] = useState("");
  const [gov, setGov] = useState("الكل");
  const [onlyMine, setOnlyMine] = useState(farmKind !== "mixed");

  const list = useMemo(() => {
    const q = query.trim();
    return vets.filter(
      (v) =>
        (gov === "الكل" || v.gov === gov) &&
        (!onlyMine || vetMatchesKind(v.specialty, farmKind)) &&
        (q === "" || `${v.name} ${v.gov} ${v.city} ${v.specialty}`.includes(q)),
    );
  }, [query, gov, onlyMine, farmKind]);

  const copy = (phone: string) => {
    navigator.clipboard?.writeText(phone);
    toast.success(`تم نسخ الرقم ${phone}`);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم الطبيب أو المدينة أو التخصص..."
          className="w-full rounded-2xl border border-border bg-card py-3.5 pr-11 pl-4 text-sm text-foreground outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
        />
      </div>

      {farmKind !== "mixed" && (
        <button
          onClick={() => setOnlyMine((v) => !v)}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
            onlyMine
              ? "bg-goldish text-accent-foreground"
              : "border border-border bg-card text-muted-foreground"
          }`}
        >
          {farmKind === "poultry"
            ? "🐓 أطباء الدواجن فقط"
            : farmKind === "livestock"
              ? "🐐 أطباء المواشي فقط"
              : "🌾 مهندسون زراعيون فقط"}
        </button>
      )}

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {["الكل", ...governorates].map((g) => (
          <button
            key={g}
            onClick={() => setGov(g)}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
              gov === g
                ? "bg-forest text-primary-foreground"
                : "border border-border bg-card text-muted-foreground"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">
            لا يوجد طبيب مطابق في الدليل المحلي — يمكنك البحث عبر الإنترنت.
          </p>
          <button
            onClick={() => onWebSearch(`أطباء بيطريون وعيادات بيطرية في سوريا: ${query || gov}`)}
            className="w-full rounded-2xl bg-goldish py-3 text-sm font-bold text-accent-foreground shadow-goldish active:scale-[0.98]"
          >
            🔎 البحث عبر الإنترنت
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((v) => (
            <div key={v.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary">
                  <Stethoscope className="h-5 w-5 text-primary" strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-primary">{v.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {v.gov} · {v.city}
                  </p>
                  <p className="mt-1 text-xs text-foreground">{v.specialty}</p>
                  <p dir="ltr" className="mt-1 text-right text-xs font-semibold text-gold">
                    {v.phone}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => copy(v.phone)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-xs font-semibold text-primary active:scale-[0.98]"
                >
                  <Copy className="h-4 w-4" /> نسخ الرقم
                </button>
                <a
                  href={`tel:${v.phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-xs font-semibold text-primary-foreground active:scale-[0.98]"
                >
                  <Phone className="h-4 w-4" /> اتصال مباشر
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}