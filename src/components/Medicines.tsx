import { useMemo, useState } from "react";
import { Search, Pill, WifiOff } from "lucide-react";
import { Vets } from "./Vets";
import { WebSearchSheet } from "./WebSearch";
import { useOnline } from "@/lib/persist";
import type { FarmKind } from "@/lib/farm";


type Origin = "وطني" | "أجنبي";

type Medicine = {
  id: string;
  trade: string;
  scientific: string;
  origin: Origin;
  uses: string;
  price: string;
  dose: string;
};

export const medicines: Medicine[] = [
  {
    id: "m1",
    trade: "أوكسي تتراسيكلين ٢٠٪ (تاميكو)",
    scientific: "Oxytetracycline",
    origin: "وطني",
    uses: "التهابات الجهاز التنفسي والهضمي في الدواجن والمواشي، الكوليرا والميكوبلازما.",
    price: "٤٥٬٠٠٠ ل.س / ١٠٠ مل",
    dose: "١ مل لكل ١٠ كجم وزن حي حقناً عضلياً لمدة ٣–٥ أيام.",
  },
  {
    id: "m2",
    trade: "إنروفلوكساسين ١٠٪",
    scientific: "Enrofloxacin",
    origin: "وطني",
    uses: "الإسهالات البكتيرية، التهاب الأمعاء، عدوى E.coli والسالمونيلا في الدواجن.",
    price: "٣٠٬٠٠٠ ل.س / لتر",
    dose: "١ مل لكل لتر ماء شرب لمدة ٣–٥ أيام متتالية.",
  },
  {
    id: "m3",
    trade: "تايلوزين تارترات",
    scientific: "Tylosin Tartrate",
    origin: "وطني",
    uses: "الميكوبلازما (CRD) في الدواجن والتهاب الضرع في المواشي.",
    price: "٣٨٬٠٠٠ ل.س / ١٠٠ غ",
    dose: "٥٠٠ غ لكل ١٠٠٠ لتر ماء لمدة ٣ أيام.",
  },
  {
    id: "m4",
    trade: "أمبروليوم ٢٠٪",
    scientific: "Amprolium",
    origin: "وطني",
    uses: "علاج والوقاية من الكوكسيديا في الدواجن والأرانب.",
    price: "٢٢٬٠٠٠ ل.س / ١٠٠ غ",
    dose: "١٢٥ غ لكل ٢٥٠ لتر ماء لمدة ٥–٧ أيام.",
  },
  {
    id: "m5",
    trade: "فيتامين AD3E",
    scientific: "Vitamin A, D3, E",
    origin: "وطني",
    uses: "دعم المناعة والنمو، تحسين الخصوبة وقشرة البيض.",
    price: "١٨٬٠٠٠ ل.س / لتر",
    dose: "١ مل لكل ٢ لتر ماء شرب لمدة ٥ أيام.",
  },
  {
    id: "m6",
    trade: "آيفوماك (Ivomec)",
    scientific: "Ivermectin 1%",
    origin: "أجنبي",
    uses: "الطفيليات الداخلية والخارجية: الجرب، القمل، الديدان في الأغنام والأبقار.",
    price: "١٢٠٬٠٠٠ ل.س / ٥٠ مل",
    dose: "١ مل لكل ٥٠ كجم وزن حي حقناً تحت الجلد، يعاد بعد ١٤ يوماً.",
  },
  {
    id: "m7",
    trade: "بايتريل (Baytril)",
    scientific: "Enrofloxacin – Bayer",
    origin: "أجنبي",
    uses: "العدوى البكتيرية الحادة في الدواجن والمواشي والحيوانات الصغيرة.",
    price: "٩٥٬٠٠٠ ل.س / ١٠٠ مل",
    dose: "٠٫٥ مل لكل ١٠ كجم وزن حي يومياً لمدة ٣–٥ أيام.",
  },
  {
    id: "m8",
    trade: "نيوبار (Neopar / لقاح جامبورو)",
    scientific: "IBD Vaccine – Intermediate",
    origin: "أجنبي",
    uses: "تحصين الدواجن ضد مرض الجامبورو (IBD).",
    price: "٦٥٬٠٠٠ ل.س / ١٠٠٠ جرعة",
    dose: "جرعة واحدة بماء الشرب في عمر ١٤ و٢١ يوماً.",
  },
  {
    id: "m9",
    trade: "كليمبرول (Draxxin)",
    scientific: "Tulathromycin",
    origin: "أجنبي",
    uses: "الالتهاب الرئوي البكتيري في الأبقار والأغنام (حقنة واحدة طويلة المفعول).",
    price: "٢٥٠٬٠٠٠ ل.س / ٥٠ مل",
    dose: "١ مل لكل ٤٠ كجم وزن حي حقنة واحدة تحت الجلد.",
  },
  {
    id: "m10",
    trade: "ألبيندازول ١٠٪",
    scientific: "Albendazole",
    origin: "وطني",
    uses: "طرد الديدان المعوية والكبدية في الأغنام والأبقار.",
    price: "٢٨٬٠٠٠ ل.س / لتر",
    dose: "٧٫٥ مل لكل ٥٠ كجم وزن حي فموياً مرة واحدة.",
  },
  {
    id: "m11",
    trade: "سلفاديميدين ٣٣٪",
    scientific: "Sulfadimidine Sodium",
    origin: "وطني",
    uses: "الكوكسيديا والتهابات الأمعاء في الدواجن والعجول.",
    price: "٢٠٬٠٠٠ ل.س / لتر",
    dose: "٢ مل لكل لتر ماء شرب لمدة ٣ أيام ثم راحة يومين.",
  },
  {
    id: "m12",
    trade: "كولستين سلفات",
    scientific: "Colistin Sulfate",
    origin: "أجنبي",
    uses: "إسهالات E.coli في الكتاكيت والعجول حديثة الولادة.",
    price: "٧٠٬٠٠٠ ل.س / ١٠٠ غ",
    dose: "١ غ لكل ٢ لتر ماء شرب لمدة ٣–٥ أيام.",
  },
];

const filters: ("الكل" | Origin)[] = ["الكل", "وطني", "أجنبي"];

/** مستلزمات المحاصيل — أسمدة ومبيدات (تعمل بدون إنترنت) */
export const cropInputs: Medicine[] = [
  {
    id: "c1",
    trade: "سماد يوريا ٤٦٪",
    scientific: "Urea 46% N",
    origin: "وطني",
    uses: "تسميد آزوتي للقمح والذرة والخضار لتحسين النمو الخضري.",
    price: "٣٥٠٬٠٠٠ ل.س / ٥٠ كجم",
    dose: "١٥–٢٥ كجم للدونم على دفعتين مع الري.",
  },
  {
    id: "c2",
    trade: "سماد NPK 20-20-20",
    scientific: "NPK Compound",
    origin: "وطني",
    uses: "تسميد متوازن للخضار والبيوت البلاستيكية.",
    price: "٤٢٠٬٠٠٠ ل.س / ٢٥ كجم",
    dose: "١ كجم لكل دونم أسبوعياً مع مياه الري.",
  },
  {
    id: "c3",
    trade: "أباميكتين ١٫٨٪",
    scientific: "Abamectin",
    origin: "أجنبي",
    uses: "مكافحة العنكبوت الأحمر وصانعات الأنفاق والتوتا في الطماطم.",
    price: "٨٥٬٠٠٠ ل.س / ١٠٠ مل",
    dose: "٤٠ مل لكل ١٠٠ لتر ماء رشاً على المجموع الخضري.",
  },
  {
    id: "c4",
    trade: "إيميداكلوبرايد ٢٠٪",
    scientific: "Imidacloprid",
    origin: "أجنبي",
    uses: "مكافحة الذبابة البيضاء والمن والحشرات الماصة.",
    price: "٧٠٬٠٠٠ ل.س / ١٠٠ مل",
    dose: "٥٠ مل لكل ١٠٠ لتر ماء، مع مراعاة فترة الأمان ٧ أيام.",
  },
  {
    id: "c5",
    trade: "مانكوزيب ٨٠٪",
    scientific: "Mancozeb",
    origin: "وطني",
    uses: "وقاية من اللفحة والبياض الزغبي في البطاطا والطماطم والعنب.",
    price: "٥٥٬٠٠٠ ل.س / كجم",
    dose: "٢٥٠ غ لكل ١٠٠ لتر ماء كل ٧–١٠ أيام وقائياً.",
  },
  {
    id: "c6",
    trade: "كبريت ميكروني",
    scientific: "Micronized Sulfur",
    origin: "وطني",
    uses: "مكافحة البياض الدقيقي والأكاروسات في العنب والخضار.",
    price: "٣٠٬٠٠٠ ل.س / كجم",
    dose: "٣٠٠ غ لكل ١٠٠ لتر ماء رشاً في الصباح الباكر.",
  },
];

/** الأدوية المناسبة لكل نوع مزرعة */
const medicineKinds: Record<string, FarmKind[]> = {
  m1: ["poultry", "livestock"],
  m2: ["poultry", "livestock"],
  m3: ["poultry", "livestock"],
  m4: ["poultry"],
  m5: ["poultry", "livestock"],
  m6: ["livestock"],
  m7: ["poultry", "livestock"],
  m8: ["poultry"],
  m9: ["livestock"],
  m10: ["livestock"],
  m11: ["poultry", "livestock"],
  m12: ["poultry", "livestock"],
};

export function Medicines({ farmKind = "mixed" }: { farmKind?: FarmKind }) {
  const online = useOnline();
  const crops = farmKind === "crops";
  const catalog = crops ? cropInputs : medicines;
  const filterable = farmKind === "poultry" || farmKind === "livestock";
  const [subTab, setSubTab] = useState<"meds" | "vets">("meds");
  const [webQuery, setWebQuery] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState<"الكل" | Origin>("الكل");
  const [openId, setOpenId] = useState<string | null>(null);
  const [onlyMine, setOnlyMine] = useState(filterable);

  const list = useMemo(() => {
    const q = query.trim();
    return catalog.filter(
      (m) =>
        (origin === "الكل" || m.origin === origin) &&
        (!onlyMine || !filterable || (medicineKinds[m.id] ?? []).includes(farmKind)) &&
        (q === "" ||
          m.trade.includes(q) ||
          m.scientific.toLowerCase().includes(q.toLowerCase()) ||
          m.uses.includes(q)),
    );
  }, [query, origin, onlyMine, filterable, farmKind, catalog]);


  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-primary">
          {crops ? "دليل المستلزمات الزراعية" : "دليل الأدوية والعيادات"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {crops
            ? "أسمدة ومبيدات وطنية وأجنبية بأسعارها، ودليل المهندسين الزراعيين حسب المحافظة"
            : "أدوية وطنية وأجنبية، ودليل الأطباء البيطريين السوريين حسب المحافظة"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-1.5">
        {(
          [
            { id: "meds", label: crops ? "🧪 الأسمدة والمبيدات" : "💊 الأدوية" },
            { id: "vets", label: crops ? "👨‍🌾 مهندسون زراعيون" : "🩺 الأطباء البيطريون السوريون" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`rounded-xl px-2 py-2.5 text-[11px] font-bold transition-colors ${
              subTab === t.id ? "bg-forest text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "vets" ? (
        <>
          <Vets onWebSearch={setWebQuery} farmKind={farmKind} />
          {webQuery && <WebSearchSheet query={webQuery} onClose={() => setWebQuery(null)} />}
        </>
      ) : (
        <>
      <div className="relative">
        <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={crops ? "ابحث باسم السماد أو المبيد..." : "ابحث باسم الدواء أو الاستخدام..."}
          className="w-full rounded-2xl border border-border bg-card py-3.5 pr-11 pl-4 text-sm text-foreground outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setOrigin(f)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              origin === f
                ? "bg-forest text-primary-foreground"
                : "border border-border bg-card text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
        {filterable && (
          <button
            onClick={() => setOnlyMine((v) => !v)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              onlyMine
                ? "bg-goldish text-accent-foreground"
                : "border border-border bg-card text-muted-foreground"
            }`}
          >
            {farmKind === "poultry" ? "🐓 يخص الدواجن" : "🐐 يخص المواشي"}
          </button>
        )}
      </div>

      {!online && (
        <p className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
          <WifiOff className="h-4 w-4 shrink-0" />
          أنت بدون إنترنت — دليل الأدوية والأطباء يعمل كاملاً، أما البحث عبر الإنترنت والمستشار
          الذكي فيحتاجان اتصالاً.
        </p>
      )}


      {list.length === 0 && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">
            لا يوجد دواء مطابق في القاعدة المحلية — يمكنك البحث عبر الإنترنت للحصول على معلومات
            محدّثة.
          </p>
          <button
            disabled={!online}
            onClick={() =>
              setWebQuery(
                `دواء بيطري أو زراعي في سوريا: ${query || "بحث عام"} — الاسم العلمي، الاستعمال، الجرعة، السعر التقديري`,
              )
            }
            className="w-full rounded-2xl bg-goldish py-3 text-sm font-bold text-accent-foreground shadow-goldish active:scale-[0.98] disabled:opacity-40"
          >
            {online ? "🔎 البحث عبر الإنترنت" : "🔌 البحث يحتاج اتصالاً بالإنترنت"}
          </button>

        </div>
      )}

      <div className="space-y-3">
        {list.map((m) => {
          const open = openId === m.id;
          return (
            <div key={m.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <button
                onClick={() => setOpenId(open ? null : m.id)}
                className="flex w-full items-center gap-3 px-4 py-4 text-right"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary">
                  <Pill className="h-5 w-5 text-primary" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-primary">{m.trade}</span>
                  <span dir="ltr" className="block truncate text-right text-[11px] text-muted-foreground">
                    {m.scientific}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                    m.origin === "وطني"
                      ? "bg-secondary text-primary"
                      : "bg-goldish/25 text-accent-foreground"
                  }`}
                >
                  {m.origin}
                </span>
              </button>

              {open && (
                <div className="space-y-3 border-t border-border/60 px-4 py-4">
                  <Field label="دواعي الاستعمال" value={m.uses} />
                  <Field label="الجرعة وطريقة الاستخدام" value={m.dose} />
                  <Field label="السعر التقديري" value={m.price} />
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    الأسعار تقديرية وقد تختلف حسب السوق — يُنصح باستشارة الطبيب البيطري قبل
                    الاستخدام.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {webQuery && <WebSearchSheet query={webQuery} onClose={() => setWebQuery(null)} />}
        </>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-wide text-gold">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}
