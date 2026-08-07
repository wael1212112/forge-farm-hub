import { useMemo, useState } from "react";
import { ArrowRight, Calculator, Plus, Trash2, X, Pencil } from "lucide-react";
import { usePersistentState } from "@/lib/persist";
import { ledgerCategoriesFor, type FarmKind } from "@/lib/farm";

type Entry = {
  id: string;
  credit: number; // مبيع / له (+)
  debit: number; // قبض / دفعة (-)
  date: string;
  note: string;
  item?: string;
  qty?: string;
  price?: string;
};

type Person = { id: string; name: string; opening?: number; entries: Entry[] };

type Category = { id: string; emoji: string; label: string; people: Person[] };

const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);

/** رمز العملة الحالي (ليرة سورية افتراضياً) */
let CURRENCY = "ل.س";

const arNum = (n: number) =>
  n.toLocaleString("ar-EG", { maximumFractionDigits: 2 }) + " " + CURRENCY;

const arDate = (v: string) => {
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString("ar-EG", { day: "numeric", month: "numeric" });
};

const sorted = (entries: Entry[]) =>
  [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

/** الرصيد النهائي = الرصيد السابق + المبيعات - الدفعات */
function balanceOf(p: Person) {
  return sorted(p.entries).reduce((s, e) => s + e.credit - e.debit, p.opening ?? 0);
}

export function Ledger({
  farmId,
  farmKind = "mixed",
  currencySymbol = "ل.س",
}: {
  farmId: string;
  farmKind?: FarmKind;
  currencySymbol?: string;
}) {
  CURRENCY = currencySymbol;
  const base = useMemo(
    () => ledgerCategoriesFor(farmKind).map((c) => ({ ...c, people: [] as Person[] })),
    [farmKind],
  );
  const [categories, setCategories] = usePersistentState<Category[]>(
    `agripulse_ledger_${farmId}_${farmKind}`,
    base,
  );
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openPerson, setOpenPerson] = useState<string | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);

  const category = categories.find((c) => c.id === openCat) ?? null;
  const person = category?.people.find((p) => p.id === openPerson) ?? null;

  const updateCategory = (catId: string, fn: (c: Category) => Category) =>
    setCategories((prev) => prev.map((c) => (c.id === catId ? fn(c) : c)));

  const addPerson = (name: string, opening: number) => {
    if (!category) return;
    const p: Person = { id: uid(), name, opening, entries: [] };
    updateCategory(category.id, (c) => ({ ...c, people: [...c.people, p] }));
    setOpenPerson(p.id);
  };

  const updatePerson = (fn: (p: Person) => Person) => {
    if (!category || !person) return;
    updateCategory(category.id, (c) => ({
      ...c,
      people: c.people.map((p) => (p.id === person.id ? fn(p) : p)),
    }));
  };

  const removePerson = (id: string) => {
    if (!category) return;
    if (!window.confirm("سيتم حذف الجهة وكل حركاتها. متابعة؟")) return;
    updateCategory(category.id, (c) => ({ ...c, people: c.people.filter((p) => p.id !== id) }));
  };

  return (
    <div className="space-y-4">
      {!category && (
        <CategoryGrid
          categories={categories}
          onOpen={(id) => {
            setOpenCat(id);
            setOpenPerson(null);
          }}
        />
      )}

      {category && !person && (
        <PeopleView
          category={category}
          onBack={() => setOpenCat(null)}
          onSelect={setOpenPerson}
          onAdd={addPerson}
          onDelete={removePerson}
        />
      )}

      {category && person && (
        <PersonView
          person={person}
          onBack={() => setOpenPerson(null)}
          onAdd={(entry) => updatePerson((p) => ({ ...p, entries: [...p.entries, { ...entry, id: uid() }] }))}
          onRemove={(entryId) =>
            updatePerson((p) => ({ ...p, entries: p.entries.filter((e) => e.id !== entryId) }))
          }
          onOpening={(v) => updatePerson((p) => ({ ...p, opening: v }))}
        />
      )}

      <button
        onClick={() => setCalcOpen(true)}
        aria-label="آلة حاسبة"
        className="fixed bottom-28 left-5 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-goldish text-accent-foreground shadow-goldish transition-transform active:scale-95"
      >
        <Calculator className="h-6 w-6" strokeWidth={1.8} />
      </button>

      {calcOpen && <CalculatorModal onClose={() => setCalcOpen(false)} />}
    </div>
  );
}

function CategoryGrid({
  categories,
  onOpen,
}: {
  categories: Category[];
  onOpen: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="text-base font-bold text-primary">كشف الحساب</h2>
      <p className="mt-1 text-xs text-muted-foreground">اختر فئة لإدارة الجهات وأرصدتها</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {categories.map((c) => {
          const net = c.people.reduce((s, p) => s + balanceOf(p), 0);
          return (
            <button
              key={c.id}
              onClick={() => onOpen(c.id)}
              className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-right shadow-sm transition-all duration-300 active:scale-[0.97]"
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="text-sm font-semibold leading-snug text-foreground">{c.label}</span>
              <span className="text-[11px] text-muted-foreground">
                {c.people.length.toLocaleString("ar-EG")} جهة
              </span>
              <span className="text-[11px] font-semibold text-gold">
                {net >= 0 ? "له" : "عليه"} {arNum(Math.abs(net))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Header({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onBack}
        aria-label="رجوع"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card shadow-sm active:scale-95"
      >
        <ArrowRight className="h-5 w-5 text-primary" strokeWidth={1.8} />
      </button>
      <div className="min-w-0">
        <h2 className="truncate text-base font-bold text-primary">{title}</h2>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function PeopleView({
  category,
  onBack,
  onSelect,
  onAdd,
  onDelete,
}: {
  category: Category;
  onBack: () => void;
  onSelect: (id: string) => void;
  onAdd: (name: string, opening: number) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [prev, setPrev] = useState("");
  const [prevSide, setPrevSide] = useState<"credit" | "debit">("credit");

  const submit = () => {
    const amount = Math.abs(Number(prev) || 0);
    onAdd(name.trim(), prevSide === "credit" ? amount : -amount);
    setName("");
    setPrev("");
  };

  return (
    <div className="space-y-4">
      <Header title={category.label} subtitle={`${category.emoji} كشوفات الحسابات`} onBack={onBack} />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold text-primary">إضافة جهة جديدة</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: التاجر أبو أحمد"
          className="input-luxe mt-3"
        />
        <p className="mt-3 text-[11px] font-semibold text-muted-foreground">
          رصيد سابق (اختياري)
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={prev}
            inputMode="decimal"
            onChange={(e) => setPrev(e.target.value)}
            placeholder="0"
            className="input-luxe min-w-0 flex-1"
          />
          <div className="flex shrink-0 gap-1">
            {(["credit", "debit"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setPrevSide(s)}
                className={`rounded-xl border px-3 text-xs font-bold ${
                  prevSide === s
                    ? "border-gold bg-secondary text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {s === "credit" ? "له" : "عليه"}
              </button>
            ))}
          </div>
        </div>
        <button
          disabled={name.trim().length < 2}
          onClick={submit}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-goldish py-3 text-sm font-bold text-accent-foreground shadow-goldish active:scale-[0.97] disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> حفظ الجهة
        </button>
      </div>

      {category.people.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          لا توجد جهات في هذه الفئة بعد.
        </p>
      ) : (
        <ul className="space-y-3">
          {category.people.map((p) => {
            const net = balanceOf(p);
            return (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <button onClick={() => onSelect(p.id)} className="min-w-0 flex-1 text-right">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {p.name}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {p.entries.length.toLocaleString("ar-EG")} حركة
                  </span>
                </button>
                <span
                  className={`shrink-0 text-left text-sm font-bold ${
                    net >= 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {arNum(Math.abs(net))}
                  <span className="block text-[10px] font-semibold text-muted-foreground">
                    {net >= 0 ? "له" : "عليه"}
                  </span>
                </span>
                <button
                  onClick={() => onDelete(p.id)}
                  aria-label="حذف الجهة"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-destructive active:scale-90"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PersonView({
  person,
  onBack,
  onAdd,
  onRemove,
  onOpening,
}: {
  person: Person;
  onBack: () => void;
  onAdd: (e: Omit<Entry, "id">) => void;
  onRemove: (id: string) => void;
  onOpening: (v: number) => void;
}) {
  const [kind, setKind] = useState<"sale" | "payment">("sale");
  const [date, setDate] = useState(today());
  const [item, setItem] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [editOpening, setEditOpening] = useState(false);
  const [openingDraft, setOpeningDraft] = useState(String(person.opening ?? 0));

  const opening = person.opening ?? 0;
  const auto = (Number(qty) || 0) * (Number(price) || 0);
  const value = Number(amount) > 0 ? Number(amount) : auto;

  const rows = useMemo(() => {
    let running = opening;
    return sorted(person.entries).map((e) => {
      running += e.credit - e.debit;
      return { entry: e, running };
    });
  }, [person.entries, opening]);

  const final = rows.length ? rows[rows.length - 1]!.running : opening;
  const totalSales = person.entries.reduce((s, e) => s + e.credit, 0);
  const totalPaid = person.entries.reduce((s, e) => s + e.debit, 0);

  const submit = () => {
    if (value <= 0) return;
    const details = [item.trim(), qty && `${qty}`, price && `× ${price}`]
      .filter(Boolean)
      .join(" ");
    onAdd({
      date,
      credit: kind === "sale" ? value : 0,
      debit: kind === "payment" ? value : 0,
      note: details || (kind === "sale" ? "مبيع" : "دفعة"),
      item: item.trim(),
      qty,
      price,
    });
    setItem("");
    setQty("");
    setPrice("");
    setAmount("");
  };

  return (
    <div className="space-y-4">
      <Header title={person.name} subtitle="كشف حساب تراكمي" onBack={onBack} />

      <div className="rounded-2xl bg-forest p-5 shadow-luxe">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[11px] text-primary-foreground/60">رصيد سابق</p>
            <p className="mt-1 text-sm font-bold text-primary-foreground">
              {arNum(Math.abs(opening))}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-primary-foreground/60">مبيعات (له)</p>
            <p className="mt-1 text-sm font-bold text-primary-foreground">{arNum(totalSales)}</p>
          </div>
          <div>
            <p className="text-[11px] text-primary-foreground/60">مقبوضات</p>
            <p className="mt-1 text-sm font-bold text-primary-foreground">{arNum(totalPaid)}</p>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-primary-foreground/15 pt-3">
          <div>
            <p className="text-[11px] text-primary-foreground/60">الرصيد النهائي</p>
            <p className="mt-1 text-xl font-bold text-gold">
              {final >= 0 ? "له" : "عليه"} {arNum(Math.abs(final))}
            </p>
          </div>
          <button
            onClick={() => {
              setOpeningDraft(String(opening));
              setEditOpening((v) => !v);
            }}
            aria-label="تعديل الرصيد السابق"
            className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/10 text-primary-foreground active:scale-90"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        {editOpening && (
          <div className="mt-3 flex gap-2">
            <input
              value={openingDraft}
              inputMode="decimal"
              onChange={(e) => setOpeningDraft(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2 text-sm text-primary-foreground outline-none"
            />
            <button
              onClick={() => {
                onOpening(Number(openingDraft) || 0);
                setEditOpening(false);
              }}
              className="shrink-0 rounded-xl bg-goldish px-4 text-xs font-bold text-accent-foreground"
            >
              حفظ
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-bold text-primary">إضافة حركة</p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {(
            [
              { id: "sale", label: "مبيع / له (+)" },
              { id: "payment", label: "قبض / دفعة (-)" },
            ] as const
          ).map((k) => (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${
                kind === k.id
                  ? "border-gold bg-secondary text-primary"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="التاريخ">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-luxe"
            />
          </Field>
          <Field label="اسم المادة">
            <input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="بيض / علف / دواء"
              className="input-luxe"
            />
          </Field>
          <Field label="الكمية">
            <input
              value={qty}
              inputMode="decimal"
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              className="input-luxe"
            />
          </Field>
          <Field label="السعر">
            <input
              value={price}
              inputMode="decimal"
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="input-luxe"
            />
          </Field>
        </div>

        <Field label={`المبلغ${auto > 0 ? ` (محسوب: ${arNum(auto)})` : ""}`}>
          <input
            value={amount}
            inputMode="decimal"
            onChange={(e) => setAmount(e.target.value)}
            placeholder={auto > 0 ? String(auto) : "0"}
            className="input-luxe mt-2"
          />
        </Field>

        <button
          disabled={value <= 0}
          onClick={submit}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3 text-sm font-bold text-primary-foreground shadow-luxe active:scale-[0.97] disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> إضافة إلى كشف الحساب
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <p className="border-b border-border px-4 py-3 text-sm font-bold text-primary">
          سجل الحركات
        </p>
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">لا توجد حركات بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[11px]">
              <thead className="bg-secondary/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-semibold">التاريخ</th>
                  <th className="px-3 py-2 font-semibold">البيان</th>
                  <th className="px-3 py-2 font-semibold">له</th>
                  <th className="px-3 py-2 font-semibold">قبض</th>
                  <th className="px-3 py-2 font-semibold">الرصيد</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ entry, running }) => (
                  <tr key={entry.id} className="border-t border-border/60">
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {arDate(entry.date)}
                    </td>
                    <td className="max-w-[8rem] truncate px-3 py-2 text-foreground">
                      {entry.note}
                    </td>
                    <td className="px-3 py-2 font-semibold text-primary">
                      {entry.credit ? entry.credit.toLocaleString("ar-EG") : "—"}
                    </td>
                    <td className="px-3 py-2 font-semibold text-destructive">
                      {entry.debit ? entry.debit.toLocaleString("ar-EG") : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-bold text-gold">
                      {Math.abs(running).toLocaleString("ar-EG")} {running >= 0 ? "له" : "عليه"}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => onRemove(entry.id)}
                        aria-label="حذف الحركة"
                        className="text-destructive active:scale-90"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-border bg-secondary/50 px-4 py-3">
          <p className="text-sm font-bold text-primary">
            الرصيد النهائي: {final >= 0 ? "له" : "عليه"} {arNum(Math.abs(final))}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const keys = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "=", "+"];

function CalculatorModal({ onClose }: { onClose: () => void }) {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("");

  const compute = () => {
    try {
      const safe = expr.replace(/×/g, "*").replace(/÷/g, "/");
      if (!/^[0-9+\-*/.() ]+$/.test(safe)) return;
      // eslint-disable-next-line no-new-func
      const val = new Function(`return (${safe})`)();
      setResult(typeof val === "number" && isFinite(val) ? String(val) : "خطأ");
    } catch {
      setResult("خطأ");
    }
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="animate-rise w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-luxe">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-primary">آلة حاسبة</p>
          <button onClick={onClose} aria-label="إغلاق" className="active:scale-90">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div dir="ltr" className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-right">
          <p className="min-h-6 text-sm text-muted-foreground">{expr || "0"}</p>
          <p className="text-2xl font-bold text-primary">{result || "—"}</p>
        </div>

        <div dir="ltr" className="mt-4 grid grid-cols-4 gap-2">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => (k === "=" ? compute() : setExpr((p) => p + k))}
              className={`rounded-xl py-3 text-base font-bold active:scale-95 ${
                k === "="
                  ? "bg-goldish text-accent-foreground shadow-goldish"
                  : "border border-border bg-background text-foreground"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => setExpr((p) => p.slice(0, -1))}
            className="rounded-xl border border-border bg-background py-3 text-sm font-bold text-foreground active:scale-95"
          >
            حذف
          </button>
          <button
            onClick={() => {
              setExpr("");
              setResult("");
            }}
            className="rounded-xl bg-forest py-3 text-sm font-bold text-primary-foreground active:scale-95"
          >
            تصفير
          </button>
        </div>
      </div>
    </div>
  );
}
