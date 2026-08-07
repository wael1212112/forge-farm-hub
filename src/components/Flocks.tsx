import { useState } from "react";
import { Plus, Trash2, Bird, X, Pencil, CalendarClock } from "lucide-react";
import { usePersistentState } from "@/lib/persist";
import { uid, today, num, arNum, arDate } from "@/lib/poultry";
import { addMonths, parseDate, spanBetween, spanLabel, toISO } from "@/lib/age";

export type Flock = {
  id: string;
  name: string;
  breed: "لاحم" | "بياض";
  count: string;
  startDate: string; // تاريخ التنزيل
  ageMonths: string; // العمر عند التنزيل - أشهر
  ageWeeks: string; // العمر عند التنزيل - أسابيع
  saleDate: string; // تاريخ البيع المتوقع
  deaths: string;
  note: string;
};

const emptyDraft = (): Flock => {
  const start = today();
  return {
    id: "",
    name: "",
    breed: "بياض",
    count: "",
    startDate: start,
    ageMonths: "0",
    ageWeeks: "0",
    saleDate: toISO(addMonths(new Date(start), 24)),
    deaths: "0",
    note: "",
  };
};

/** تاريخ الفقس التقديري = تاريخ التنزيل - العمر عند التنزيل */
function birthDate(f: Flock) {
  const start = parseDate(f.startDate) ?? new Date();
  const back = addMonths(start, -Math.max(0, num(f.ageMonths)));
  back.setDate(back.getDate() - Math.max(0, num(f.ageWeeks)) * 7);
  return back;
}

/** إدارة الأفواج (الدفعات) لمزرعة دواجن واحدة */
export function Flocks({ farmId }: { farmId: string }) {
  const [flocks, setFlocks] = usePersistentState<Flock[]>(`agripulse_flocks_${farmId}`, []);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Flock>(emptyDraft);

  const openNew = () => {
    setDraft(emptyDraft());
    setOpen(true);
  };

  const openEdit = (f: Flock) => {
    setDraft({ ...emptyDraft(), ...f });
    setOpen(true);
  };

  const save = () => {
    const name = draft.name.trim() || `فوج ${arNum(flocks.length + 1)}`;
    const clean: Flock = {
      ...draft,
      name,
      startDate: draft.startDate || today(),
      saleDate: draft.saleDate || toISO(addMonths(new Date(draft.startDate || today()), 24)),
    };
    setFlocks((prev) =>
      clean.id
        ? prev.map((f) => (f.id === clean.id ? clean : f))
        : [{ ...clean, id: uid() }, ...prev],
    );
    setDraft(emptyDraft());
    setOpen(false);
  };


  const remove = (id: string) => {
    if (!window.confirm("سيتم حذف هذا الفوج نهائياً. متابعة؟")) return;
    setFlocks((prev) => prev.filter((f) => f.id !== id));
  };

  const addDeath = (id: string, n: number) =>
    setFlocks((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, deaths: String(Math.max(0, num(f.deaths) + n)) } : f,
      ),
    );

  const totalBirds = flocks.reduce((s, f) => s + Math.max(0, num(f.count) - num(f.deaths)), 0);
  const totalDeaths = flocks.reduce((s, f) => s + num(f.deaths), 0);

  // تحديث تاريخ البيع تلقائياً (سنتان) عند تغيير تاريخ التنزيل لفوج جديد
  const onStartChange = (v: string) => {
    const d = parseDate(v);
    setDraft((p) => ({
      ...p,
      startDate: v,
      saleDate: !p.id && d ? toISO(addMonths(d, 24)) : p.saleDate,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat title="الأفواج" value={arNum(flocks.length)} />
        <Stat title="الطيور الحالية" value={arNum(totalBirds)} />
        <Stat title="إجمالي النفوق" value={arNum(totalDeaths)} />
      </div>

      <button
        onClick={openNew}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-primary-foreground shadow-luxe active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" /> إضافة فوج جديد
      </button>

      {flocks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          لا توجد أفواج بعد — أضف أول فوج لمتابعة العمر بالأشهر والأسابيع وموعد البيع.
        </p>
      ) : (
        <ul className="space-y-3">
          {flocks.map((f) => {
            const start = num(f.count);
            const dead = num(f.deaths);
            const alive = Math.max(0, start - dead);
            const rate = start > 0 ? (dead / start) * 100 : 0;
            const now = new Date();
            const age = spanBetween(birthDate(f), now);
            const sale = parseDate(f.saleDate);
            const left = sale ? spanBetween(now, sale) : null;

            return (
              <li key={f.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-bold text-primary">
                      <Bird className="h-4 w-4 shrink-0 text-gold" /> {f.name}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {f.breed} • نزل بتاريخ {arDate(f.startDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => openEdit(f)}
                      aria-label="تعديل الفوج"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-border text-primary active:scale-90"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(f.id)}
                      aria-label="حذف الفوج"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-border text-destructive active:scale-90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-forest p-4 text-primary-foreground">
                  <p className="text-[11px] text-primary-foreground/60">العمر الحالي</p>
                  <p className="mt-1 text-lg font-bold text-gold">{spanLabel(age)}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-primary-foreground/70">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {left && left.totalDays > 0
                      ? `المتبقي حتى البيع: ${spanLabel(left)} (${arDate(f.saleDate)})`
                      : `حان موعد البيع/التصفية (${arDate(f.saleDate)})`}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Mini label="العدد الأولي" value={arNum(start)} />
                  <Mini label="الحي الآن" value={arNum(alive)} />
                  <Mini label="نسبة النفوق" value={`${arNum(rate.toFixed(1))}%`} />
                </div>

                {f.note && (
                  <p className="mt-3 rounded-xl bg-secondary/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                    {f.note}
                  </p>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => addDeath(f.id, 1)}
                    className="flex-1 rounded-xl border border-border bg-background py-2 text-xs font-semibold text-foreground active:scale-95"
                  >
                    + نفوق ١
                  </button>
                  <button
                    onClick={() => addDeath(f.id, 5)}
                    className="flex-1 rounded-xl border border-border bg-background py-2 text-xs font-semibold text-foreground active:scale-95"
                  >
                    + نفوق ٥
                  </button>
                  <button
                    onClick={() => addDeath(f.id, -1)}
                    className="flex-1 rounded-xl border border-border bg-background py-2 text-xs font-semibold text-muted-foreground active:scale-95"
                  >
                    تراجع
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <div dir="rtl" className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            aria-label="إغلاق"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <div className="animate-rise relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-border bg-background px-6 pb-8 pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">
                {draft.id ? "✏️ تعديل الفوج" : "🐣 فوج جديد"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <Field label="اسم الفوج">
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="مثال: عنبر ١ - دفعة آذار"
                className="input-luxe"
              />
            </Field>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["لاحم", "بياض"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setDraft({ ...draft, breed: b })}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                    draft.breed === b
                      ? "border-gold bg-secondary text-primary"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <Field label="عدد الطيور">
              <input
                value={draft.count}
                inputMode="numeric"
                onChange={(e) => setDraft({ ...draft, count: e.target.value })}
                placeholder="5000"
                className="input-luxe"
              />
            </Field>

            <Field label="تاريخ تنزيل الفوج">
              <input
                type="date"
                value={draft.startDate}
                onChange={(e) => onStartChange(e.target.value)}
                className="input-luxe"
              />
            </Field>

            <p className="mt-4 text-sm font-semibold text-primary">العمر عند التنزيل</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-[11px] text-muted-foreground">أشهر</span>
                <input
                  value={draft.ageMonths}
                  inputMode="numeric"
                  onChange={(e) =>
                    setDraft({ ...draft, ageMonths: e.target.value.replace(/\D/g, "") })
                  }
                  className="input-luxe mt-1"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] text-muted-foreground">أسابيع</span>
                <input
                  value={draft.ageWeeks}
                  inputMode="numeric"
                  onChange={(e) =>
                    setDraft({ ...draft, ageWeeks: e.target.value.replace(/\D/g, "") })
                  }
                  className="input-luxe mt-1"
                />
              </label>
            </div>

            <Field label="تاريخ البيع المتوقع (افتراضياً بعد سنتين)">
              <input
                type="date"
                value={draft.saleDate}
                onChange={(e) => setDraft({ ...draft, saleDate: e.target.value })}
                className="input-luxe"
              />
            </Field>

            <Field label="ملاحظات">
              <textarea
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                rows={2}
                placeholder="مصدر الكتاكيت، برنامج التحصين..."
                className="input-luxe"
              />
            </Field>

            <button
              onClick={save}
              className="mt-6 w-full rounded-2xl bg-goldish py-3.5 text-sm font-bold text-accent-foreground shadow-goldish active:scale-[0.97]"
            >
              {draft.id ? "حفظ التعديلات" : "حفظ الفوج"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-4 block">
      <span className="block text-sm font-semibold text-primary">{label}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm">
      <p className="text-[11px] text-muted-foreground">{title}</p>
      <p className="mt-1 text-lg font-bold text-primary">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 px-2 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-primary">{value}</p>
    </div>
  );
}
