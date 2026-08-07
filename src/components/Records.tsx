import { useMemo, useState } from "react";
import { usePersistentState } from "@/lib/persist";
import { CalendarClock, Pencil, Plus, Trash2, X } from "lucide-react";

export type FarmKind = "poultry" | "livestock" | "crops" | "mixed";

type FieldType = "text" | "number" | "date" | "select";

type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  unit?: string;
  options?: string[];
  reminder?: string; // label used when this date is upcoming
};

type RecordItem = { id: string; [key: string]: string };

type Section = {
  id: Exclude<FarmKind, "mixed">;
  emoji: string;
  title: string;
  subtitle: string;
  addLabel: string;
  titleKey: string;
  fields: FieldDef[];
};

const uid = () => Math.random().toString(36).slice(2, 9);


const arDate = (v: string) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
};

const arNum = (v: string) => {
  const n = Number(v);
  return isNaN(n) || v === "" ? v || "—" : n.toLocaleString("ar-EG");
};

const daysUntil = (v: string) => {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  const t = new Date();
  d.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
};

const sections: Section[] = [
  {
    id: "poultry",
    emoji: "🐓",
    title: "سجلات الدواجن",
    subtitle: "الدفعات، الإنتاج، العلف والتحصين",
    addLabel: "إضافة دفعة جديدة",
    titleKey: "batch",
    fields: [
      { key: "batch", label: "اسم الدفعة", type: "text", placeholder: "مثال: دفعة العنبر الأول" },
      { key: "count", label: "عدد الطيور", type: "number", placeholder: "0", unit: "طائر" },
      { key: "eggs", label: "إنتاج البيض اليومي", type: "number", placeholder: "0", unit: "بيضة" },
      { key: "age", label: "العمر", type: "number", placeholder: "0", unit: "أسبوع" },
      { key: "feed", label: "استهلاك العلف اليومي", type: "number", placeholder: "0", unit: "كجم" },
      { key: "vaccine", label: "موعد التطعيم القادم", type: "date", reminder: "موعد تطعيم" },
    ],
  },
  {
    id: "livestock",
    emoji: "🐐",
    title: "سجلات المواشي والأغنام",
    subtitle: "المجموعات، الحالة الصحية والتلقيح",
    addLabel: "إضافة مجموعة جديدة",
    titleKey: "group",
    fields: [
      { key: "group", label: "اسم المجموعة / الوسم", type: "text", placeholder: "مثال: قطيع الأغنام أ" },
      { key: "count", label: "العدد", type: "number", placeholder: "0", unit: "رأس" },
      {
        key: "health",
        label: "الحالة الصحية",
        type: "select",
        options: ["سليمة", "تحت الملاحظة", "قيد العلاج"],
      },
      { key: "breeding", label: "موعد التلقيح القادم", type: "date", reminder: "موعد تلقيح" },
      { key: "vaccine", label: "موعد التطعيم القادم", type: "date", reminder: "موعد تطعيم" },
    ],
  },
  {
    id: "crops",
    emoji: "🌾",
    title: "سجلات المحاصيل",
    subtitle: "المساحات، مواعيد الزراعة والري",
    addLabel: "إضافة محصول جديد",
    titleKey: "crop",
    fields: [
      { key: "crop", label: "اسم المحصول", type: "text", placeholder: "مثال: قمح بعل" },
      { key: "area", label: "المساحة المزروعة", type: "number", placeholder: "0", unit: "دونم" },
      { key: "planted", label: "تاريخ الزراعة", type: "date" },
      { key: "harvest", label: "موعد الحصاد المتوقع", type: "date", reminder: "موعد حصاد" },
      { key: "irrigation", label: "موعد الري القادم", type: "date", reminder: "موعد ري" },
    ],
  },
];

const seed: Record<string, RecordItem[]> = {
  poultry: [],
  livestock: [],
  crops: [],
};

export function Records({ farmKind, farmId = "default" }: { farmKind: FarmKind; farmId?: string }) {
  const visible = useMemo(
    () => (farmKind === "mixed" ? sections : sections.filter((s) => s.id === farmKind)),
    [farmKind],
  );
  const [active, setActive] = useState(visible[0]!.id);
  const [data, setData] = usePersistentState<Record<string, RecordItem[]>>(
    `agripulse_records_${farmId}`,
    seed,
  );
  const [editing, setEditing] = useState<RecordItem | "new" | null>(null);

  const section = visible.find((s) => s.id === active) ?? visible[0]!;
  const items = data[section.id] ?? [];

  const save = (item: RecordItem) => {
    setData((prev) => {
      const list = prev[section.id] ?? [];
      const exists = list.some((r) => r.id === item.id);
      return {
        ...prev,
        [section.id]: exists ? list.map((r) => (r.id === item.id ? item : r)) : [...list, item],
      };
    });
    setEditing(null);
  };

  const remove = (id: string) =>
    setData((prev) => ({
      ...prev,
      [section.id]: (prev[section.id] ?? []).filter((r) => r.id !== id),
    }));

  const reminders = items.flatMap((item) =>
    section.fields
      .filter((f) => f.reminder && item[f.key])
      .map((f) => ({ item, field: f, days: daysUntil(item[f.key]!) }))
      .filter((r) => r.days !== null && r.days >= 0 && r.days <= 7),
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-primary">{section.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{section.subtitle}</p>
      </div>

      {visible.length > 1 && (
        <div className="flex gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
          {visible.map((s) => {
            const on = s.id === active;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex-1 rounded-xl py-2.5 text-[12px] font-semibold transition-all duration-300 ${
                  on
                    ? "bg-goldish text-accent-foreground shadow-goldish"
                    : "text-muted-foreground active:scale-95"
                }`}
              >
                <span className="ml-1">{s.emoji}</span>
                {s.id === "poultry" ? "دواجن" : s.id === "livestock" ? "مواشي" : "محاصيل"}
              </button>
            );
          })}
        </div>
      )}

      {reminders.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold tracking-widest text-gold">تذكيرات قادمة</p>
          {reminders.map((r, i) => {
            const soon = (r.days ?? 0) <= 1;
            const when = r.days === 0 ? "اليوم" : r.days === 1 ? "غداً" : `بعد ${arNum(String(r.days))} أيام`;
            return (
              <div key={`${r.item.id}-${r.field.key}-${i}`} className="flex items-center gap-2">
                <CalendarClock
                  className={`h-4 w-4 shrink-0 ${soon ? "text-amber" : "text-leaf"}`}
                  strokeWidth={1.8}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {r.item[section.titleKey] || "—"}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    soon ? "bg-amber/15 text-amber" : "bg-leaf/15 text-leaf"
                  }`}
                >
                  {r.field.reminder} {when}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setEditing("new")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-goldish py-3.5 text-sm font-bold text-accent-foreground shadow-goldish transition-transform active:scale-[0.97]"
      >
        {section.addLabel}
        <Plus className="h-4 w-4" strokeWidth={2.4} />
      </button>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          لا توجد سجلات بعد — ابدأ بإضافة أول سجل لمزرعتك.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-primary">
                    <span className="ml-1">{section.emoji}</span>
                    {item[section.titleKey] || "بدون اسم"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setEditing(item)}
                    aria-label="تعديل"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background text-primary active:scale-90"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    aria-label="حذف"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background text-destructive active:scale-90"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/60 pt-3">
                {section.fields
                  .filter((f) => f.key !== section.titleKey)
                  .map((f) => {
                    const raw = item[f.key] ?? "";
                    const days = f.reminder ? daysUntil(raw) : null;
                    const soon = days !== null && days >= 0 && days <= 1;
                    return (
                      <div key={f.key} className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">{f.label}</p>
                        <p
                          className={`mt-0.5 truncate text-sm font-semibold ${
                            soon ? "text-amber" : "text-foreground"
                          }`}
                        >
                          {f.type === "date"
                            ? arDate(raw)
                            : f.type === "number"
                              ? `${arNum(raw)}${f.unit ? ` ${f.unit}` : ""}`
                              : raw || "—"}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <RecordForm
          section={section}
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function RecordForm({
  section,
  initial,
  onClose,
  onSave,
}: {
  section: Section;
  initial: RecordItem | null;
  onClose: () => void;
  onSave: (item: RecordItem) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    section.fields.forEach((f) => {
      base[f.key] = initial?.[f.key] ?? (f.type === "select" ? (f.options?.[0] ?? "") : "");
    });
    return base;
  });

  const ready = (values[section.titleKey] ?? "").trim().length > 1;

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="animate-rise max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-luxe">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-primary">
            {initial ? "تعديل السجل" : section.addLabel}
          </p>
          <button onClick={onClose} aria-label="إغلاق" className="active:scale-90">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {section.fields.map((f) => (
            <label key={f.key} className={f.type === "text" ? "col-span-2 block" : "block"}>
              <span className="mb-2 block text-[11px] font-semibold text-muted-foreground">
                {f.label}
                {f.unit ? ` (${f.unit})` : ""}
              </span>
              {f.type === "select" ? (
                <select
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
                >
                  {f.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  inputMode={f.type === "number" ? "decimal" : undefined}
                  value={values[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
                />
              )}
            </label>
          ))}
        </div>

        <button
          disabled={!ready}
          onClick={() => onSave({ ...values, id: initial?.id ?? uid() })}
          className="mt-4 w-full rounded-2xl bg-goldish py-3 text-sm font-bold text-accent-foreground shadow-goldish active:scale-[0.97] disabled:opacity-40"
        >
          حفظ السجل
        </button>
      </div>
    </div>
  );
}
