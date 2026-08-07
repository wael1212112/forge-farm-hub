import { useEffect, useMemo, useState } from "react";
import { usePersistentState } from "@/lib/persist";
import {
  applyAllocations,
  arDate,
  arFullDate,
  arNum,
  DAYS,
  isThisMonth,
  listCreditors,
  monthLabel,
  nextSaleInfo,
  num,
  today,
  TRAYS_PER_CRATE,
  uid,
  type Allocation,
  type Creditor,
  type EggSale,
  type FeedEntry,
} from "@/lib/poultry";
import {
  ArrowRight,
  CalendarClock,
  Coins,
  Egg,
  Minus,
  Pencil,
  Plus,
  Trash2,
  Wheat,
  X,
} from "lucide-react";

export type { EggSale, FeedEntry };

const eggsKey = (farmId: string) => `agripulse_egg_sales_${farmId}`;
const feedKey = (farmId: string) => `agripulse_feed_log_${farmId}`;
const intervalKey = (farmId: string) => `agripulse_egg_interval_${farmId}`;

/* ------------------------------- بطاقات الرئيسية ------------------------------- */

export function PoultryCards({
  farmId,
  currencySymbol,
  onOpenEggs,
  onOpenFeed,
}: {
  farmId: string;
  currencySymbol: string;
  onOpenEggs: () => void;
  onOpenFeed: () => void;
}) {
  const [interval, setInterval] = usePersistentState<number>(intervalKey(farmId), 4);
  const [sales] = usePersistentState<EggSale[]>(eggsKey(farmId), []);
  const [feed] = usePersistentState<FeedEntry[]>(feedKey(farmId), []);

  const info = useMemo(() => nextSaleInfo(sales, interval), [sales, interval]);

  const monthSales = sales.filter((s) => isThisMonth(s.date));
  const monthFeed = feed.filter((f) => isThisMonth(f.date));
  const revenue = monthSales.reduce((s, r) => s + num(r.price), 0);
  const crates = monthSales.reduce((s, r) => s + num(r.crates), 0);
  const expenses = monthFeed.reduce((s, r) => s + num(r.price), 0);
  const debtPaid = monthSales.reduce(
    (s, r) => s + (r.allocations ?? []).reduce((a, x) => a + num(x.amount), 0),
    0,
  );
  const net = revenue - expenses - debtPaid;

  return (
    <div className="space-y-4">
      {/* موعد بيع البيض */}
      <div className="rounded-2xl border border-gold/40 bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-goldish text-accent-foreground">
            <CalendarClock className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-primary">موعد بيع البيض</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              نقلة كل {arNum(interval)} {interval === 1 ? "يوم" : "أيام"}
              {info.last ? ` · آخر نقلة ${arDate(info.last.toISOString().slice(0, 10))}` : " · لم تُسجّل نقلات بعد"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-forest p-4 text-primary-foreground shadow-luxe">
          <p className="text-[11px] text-primary-foreground/70">الموعد القادم</p>
          <p className="mt-1 text-sm font-bold">
            {info.daysLeft === 0
              ? `اليوم — يوم ${DAYS[info.next.getDay()]}`
              : `بعد ${arNum(info.daysLeft)} ${info.daysLeft === 1 ? "يوم" : "أيام"} — يوم ${info.dayName}`}
          </p>
          <p className="mt-1 text-[11px] text-primary-foreground/70">{arFullDate(info.next)}</p>
        </div>

        <p className="mt-4 text-[11px] font-semibold text-muted-foreground">تكرار النقلة (أيام)</p>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => setInterval((v) => Math.max(1, v - 1))}
            aria-label="تقليل"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-background text-primary active:scale-90"
          >
            <Minus className="h-4 w-4" strokeWidth={2} />
          </button>
          <div className="flex flex-1 gap-1.5">
            {[2, 3, 4, 5, 7].map((d) => (
              <button
                key={d}
                onClick={() => setInterval(d)}
                className={`flex-1 rounded-xl py-2 text-[11px] font-semibold transition-all ${
                  d === interval
                    ? "bg-goldish text-accent-foreground shadow-goldish"
                    : "border border-border bg-background text-muted-foreground active:scale-95"
                }`}
              >
                {arNum(d)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setInterval((v) => Math.min(60, v + 1))}
            aria-label="زيادة"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-background text-primary active:scale-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* الملخص المالي الشهري */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
            <Coins className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-primary">الملخص المالي — {monthLabel()}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              يُحسب تلقائياً من مبيعات الشهر ومصاريف الأعلاف والتسديدات.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniStat title="مبيعات الشهر" value={`${arNum(revenue)} ${currencySymbol}`} />
          <MiniStat title="مصاريف الأعلاف" value={`${arNum(expenses)} ${currencySymbol}`} />
          <MiniStat title="المسدد للديون" value={`${arNum(debtPaid)} ${currencySymbol}`} />
          <MiniStat
            title="صافي الربح الشهري"
            value={`${arNum(net)} ${currencySymbol}`}
            tone={net >= 0 ? "good" : "bad"}
          />
        </div>
      </div>

      <ModuleCard
        emoji="🥚"
        icon={<Egg className="h-5 w-5" strokeWidth={1.9} />}
        title="مبيعات البيض"
        hint={
          monthSales.length === 0
            ? "لم تُسجّل مبيعات هذا الشهر — ابدأ بتسجيل أول نقلة."
            : `${arNum(monthSales.length)} نقلة هذا الشهر · ${arNum(crates)} كرتونة · ${arNum(revenue)} ${currencySymbol}`
        }
        action="تسجيل مبيعات البيض"
        onOpen={onOpenEggs}
      />

      <ModuleCard
        emoji="🌾"
        icon={<Wheat className="h-5 w-5" strokeWidth={1.9} />}
        title="الأعلاف ومواد التغذية"
        hint={
          feed.length === 0
            ? "سجّل شحنات الذرة والصويا والشعير ومصاريفها."
            : `${arNum(monthFeed.length)} شحنة هذا الشهر · ${arNum(expenses)} ${currencySymbol}`
        }
        action="سجل الأعلاف"
        onOpen={onOpenFeed}
      />
    </div>
  );
}

function ModuleCard({
  emoji,
  icon,
  title,
  hint,
  action,
  onOpen,
}: {
  emoji: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
  action: string;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-primary">
            <span className="ml-1">{emoji}</span>
            {title}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
        </div>
      </div>
      <button
        onClick={onOpen}
        className="mt-4 w-full rounded-2xl bg-forest py-3 text-sm font-bold text-primary-foreground shadow-luxe active:scale-[0.98]"
      >
        {action}
      </button>
    </div>
  );
}

/* --------------------------------- صفحة البيض -------------------------------- */

export function EggSalesPage({
  farmId,
  currencySymbol,
  onBack,
}: {
  farmId: string;
  currencySymbol: string;
  onBack: () => void;
}) {
  const [sales, setSales] = usePersistentState<EggSale[]>(eggsKey(farmId), []);
  const [editing, setEditing] = useState<EggSale | "new" | null>(null);

  const monthSales = sales.filter((s) => isThisMonth(s.date));
  const monthRevenue = monthSales.reduce((s, r) => s + num(r.price), 0);
  const monthCrates = monthSales.reduce((s, r) => s + num(r.crates), 0);
  const monthPaid = monthSales.reduce(
    (s, r) => s + (r.allocations ?? []).reduce((a, x) => a + num(x.amount), 0),
    0,
  );

  const save = (item: EggSale, allocations: Allocation[]) => {
    setSales((prev) =>
      prev.some((r) => r.id === item.id)
        ? prev.map((r) => (r.id === item.id ? item : r))
        : [item, ...prev],
    );
    applyAllocations(farmId, allocations, `تسديد من نقلة بيض — ${item.buyer || "بيعة"}`);
  };

  return (
    <div className="space-y-4">
      <PageHead
        title="مبيعات البيض"
        subtitle={`سجّل كل نقلة: عدد الكراتين (كل كرتونة = ${arNum(TRAYS_PER_CRATE)} طبق)، السعر، والتاجر.`}
        onBack={onBack}
      />

      <div className="rounded-2xl bg-forest p-5 shadow-luxe">
        <p className="text-[11px] text-primary-foreground/70">
          إجمالي المبيعات الشهري — {monthLabel()}
        </p>
        <p className="mt-1 text-2xl font-bold text-primary-foreground">
          {arNum(monthRevenue)} {currencySymbol}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-primary-foreground/15 pt-3 text-primary-foreground">
          <SmallStat label="النقلات" value={`${arNum(monthSales.length)}`} />
          <SmallStat label="الكراتين" value={`${arNum(monthCrates)}`} />
          <SmallStat label="المسدد للديون" value={arNum(monthPaid)} />
        </div>
      </div>

      <button
        onClick={() => setEditing("new")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-goldish py-3.5 text-sm font-bold text-accent-foreground shadow-goldish active:scale-[0.97]"
      >
        إضافة نقلة جديدة <Plus className="h-4 w-4" strokeWidth={2.4} />
      </button>

      {sales.length === 0 ? (
        <Empty text="لا توجد مبيعات بعد — كل نقلة تُحفظ على جهازك وتعمل بدون إنترنت." />
      ) : (
        <ul className="space-y-3">
          {sales.map((s) => {
            const paid = (s.allocations ?? []).reduce((a, x) => a + num(x.amount), 0);
            const left = num(s.price) - paid;
            return (
              <li key={s.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-primary">
                      🥚 {s.buyer || "بدون اسم"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{arDate(s.date)}</p>
                  </div>
                  <RowActions
                    onEdit={() => setEditing(s)}
                    onDelete={() => setSales((p) => p.filter((r) => r.id !== s.id))}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
                  <Field label="الكراتين" value={`${arNum(s.crates)} كرتونة`} />
                  <Field
                    label="الأطباق"
                    value={`${arNum(num(s.crates) * TRAYS_PER_CRATE)} طبق`}
                  />
                  <Field label="ثمن النقلة" value={`${arNum(s.price)} ${currencySymbol}`} />
                </div>
                {paid > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
                    <Field label="المسدد للديون" value={`${arNum(paid)} ${currencySymbol}`} />
                    <Field label="السيولة المتبقية" value={`${arNum(left)} ${currencySymbol}`} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <EggSaleSheet
          farmId={farmId}
          currencySymbol={currencySymbol}
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(sale, allocations) => {
            save(sale, allocations);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EggSaleSheet({
  farmId,
  currencySymbol,
  initial,
  onClose,
  onSave,
}: {
  farmId: string;
  currencySymbol: string;
  initial: EggSale | null;
  onClose: () => void;
  onSave: (sale: EggSale, allocations: Allocation[]) => void;
}) {
  const [buyer, setBuyer] = useState(initial?.buyer ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const [crates, setCrates] = useState(initial?.crates ?? "");
  const [perCrate, setPerCrate] = useState(initial?.pricePerCrate ?? "");
  const [total, setTotal] = useState(initial?.price ?? "");
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [alloc, setAlloc] = useState<Record<string, string>>({});

  useEffect(() => {
    setCreditors(listCreditors(farmId));
  }, [farmId]);

  // السعر الإجمالي يُحسب تلقائياً من سعر الكرتونة
  useEffect(() => {
    if (num(crates) > 0 && num(perCrate) > 0) setTotal(String(num(crates) * num(perCrate)));
  }, [crates, perCrate]);

  const revenue = num(total);
  const paid = Object.values(alloc).reduce((s, v) => s + num(v), 0);
  const left = revenue - paid;
  const ready = buyer.trim().length > 1 && revenue > 0 && paid <= revenue;

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="animate-rise max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-luxe">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-primary">
            {initial ? "تعديل النقلة" : "نقلة بيض جديدة"}
          </p>
          <button onClick={onClose} aria-label="إغلاق" className="active:scale-90">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Input
            wide
            label="اسم التاجر / المشتري"
            value={buyer}
            onChange={setBuyer}
            type="text"
          />
          <Input label="التاريخ" value={date} onChange={setDate} type="date" />
          <Input label="عدد الكراتين" value={crates} onChange={setCrates} type="number" />
          <Input
            label={`سعر الكرتونة (${currencySymbol})`}
            value={perCrate}
            onChange={setPerCrate}
            type="number"
          />
          <Input
            label={`ثمن النقلة الإجمالي (${currencySymbol})`}
            value={total}
            onChange={setTotal}
            type="number"
          />
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">
          {arNum(crates || 0)} كرتونة = {arNum(num(crates) * TRAYS_PER_CRATE)} طبق (كل كرتونة ={" "}
          {arNum(TRAYS_PER_CRATE)} طبق)
        </p>

        {/* توزيع ثمن النقلة على الديون */}
        <div className="mt-5 rounded-2xl border border-border bg-background p-4">
          <p className="text-sm font-bold text-primary">توزيع ثمن النقلة على الديون</p>
          {creditors.length === 0 ? (
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              لا توجد ديون مسجّلة في دفتر الحسابات — أضف تجار الأعلاف أو الطبيب أو العمال من تبويب
              «الحسابات» لتوزيع المبالغ عليهم.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {creditors.map((c) => (
                <li key={c.key} className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {c.emoji} {c.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      دين {arNum(c.owed)} {currencySymbol}
                    </p>
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={alloc[c.key] ?? ""}
                    onChange={(e) => setAlloc((v) => ({ ...v, [c.key]: e.target.value }))}
                    className="w-28 shrink-0 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat title="ثمن النقلة" value={`${arNum(revenue)} ${currencySymbol}`} />
          <MiniStat title="المسدد للديون" value={`${arNum(paid)} ${currencySymbol}`} />
          <MiniStat
            title="السيولة المتبقية"
            value={`${arNum(left)} ${currencySymbol}`}
            tone={left >= 0 ? "good" : "bad"}
          />
        </div>
        {paid > revenue && (
          <p className="mt-2 text-[11px] font-semibold text-destructive">
            المبالغ الموزّعة أكبر من ثمن النقلة.
          </p>
        )}

        <button
          disabled={!ready}
          onClick={() =>
            onSave(
              {
                id: initial ? initial.id : uid(),
                date: date || today(),
                crates,
                pricePerCrate: perCrate,
                price: total,
                buyer,
                allocations: creditors
                  .map((c) => ({ key: c.key, name: c.name, amount: num(alloc[c.key]) }))
                  .filter((a) => a.amount > 0),
              },
              creditors
                .map((c) => ({ key: c.key, name: c.name, amount: num(alloc[c.key]) }))
                .filter((a) => a.amount > 0),
            )
          }
          className="mt-4 w-full rounded-2xl bg-goldish py-3 text-sm font-bold text-accent-foreground shadow-goldish active:scale-[0.97] disabled:opacity-40"
        >
          حفظ النقلة وتسديد الديون
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- صفحة الأعلاف ------------------------------- */

const FEED_ITEMS = ["ذرة صفراء", "كسبة صويا", "شعير", "قمح", "نخالة", "بريمكس", "أخرى"];

export function FeedLogPage({
  farmId,
  currencySymbol,
  onBack,
}: {
  farmId: string;
  currencySymbol: string;
  onBack: () => void;
}) {
  const [log, setLog] = usePersistentState<FeedEntry[]>(feedKey(farmId), []);
  const [editing, setEditing] = useState<FeedEntry | "new" | null>(null);

  const monthLog = log.filter((f) => isThisMonth(f.date));
  const total = monthLog.reduce((s, r) => s + num(r.price), 0);
  const kg = monthLog.reduce((s, r) => s + num(r.weight) * (r.unit === "طن" ? 1000 : 1), 0);

  const save = (item: FeedEntry) =>
    setLog((prev) =>
      prev.some((r) => r.id === item.id)
        ? prev.map((r) => (r.id === item.id ? item : r))
        : [item, ...prev],
    );

  return (
    <div className="space-y-4">
      <PageHead
        title="الأعلاف ومواد التغذية"
        subtitle="سجّل شحنات الذرة والصويا والشعير: الوزن، التاجر، والسعر."
        onBack={onBack}
      />

      <div className="grid grid-cols-2 gap-3">
        <MiniStat
          title={`مصروف ${monthLabel()}`}
          value={`${arNum(total)} ${currencySymbol}`}
        />
        <MiniStat title="وزن الشهر" value={`${arNum(kg)} كجم`} />
      </div>

      <button
        onClick={() => setEditing("new")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-goldish py-3.5 text-sm font-bold text-accent-foreground shadow-goldish active:scale-[0.97]"
      >
        إضافة شحنة علف <Plus className="h-4 w-4" strokeWidth={2.4} />
      </button>

      {log.length === 0 ? (
        <Empty text="لا توجد شحنات بعد — كل شحنة تُحفظ على جهازك وتعمل بدون إنترنت." />
      ) : (
        <ul className="space-y-3">
          {log.map((f) => (
            <li key={f.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-primary">🌾 {f.item || "علف"}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {arDate(f.date)} · {f.trader || "بدون تاجر"}
                  </p>
                </div>
                <RowActions
                  onEdit={() => setEditing(f)}
                  onDelete={() => setLog((p) => p.filter((r) => r.id !== f.id))}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
                <Field label="الوزن" value={`${arNum(f.weight)} ${f.unit || "كجم"}`} />
                <Field label="السعر" value={`${arNum(f.price)} ${currencySymbol}`} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <FormSheet
          title={editing === "new" ? "شحنة علف جديدة" : "تعديل الشحنة"}
          onClose={() => setEditing(null)}
          onSave={(v) => {
            save({
              id: editing === "new" ? uid() : editing.id,
              date: v['date'] || today(),
              item: v['item'] ?? "",
              weight: v['weight'] ?? "",
              unit: v['unit'] || "كجم",
              price: v['price'] ?? "",
              trader: v['trader'] ?? "",
            });
            setEditing(null);
          }}
          requiredKey="trader"
          initial={
            editing === "new"
              ? { date: today(), item: FEED_ITEMS[0]!, weight: "", unit: "كجم", price: "", trader: "" }
              : { ...editing }
          }
          fields={[
            { key: "trader", label: "اسم التاجر / المورّد", type: "text", wide: true },
            { key: "item", label: "نوع المادة", type: "select", options: FEED_ITEMS },
            { key: "date", label: "التاريخ", type: "date" },
            { key: "weight", label: "الوزن", type: "number" },
            { key: "unit", label: "الوحدة", type: "select", options: ["كجم", "طن"] },
            { key: "price", label: `السعر الإجمالي (${currencySymbol})`, type: "number", wide: true },
          ]}
        />
      )}
    </div>
  );
}

/* --------------------------------- عناصر مشتركة -------------------------------- */

function PageHead({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        onClick={onBack}
        aria-label="رجوع"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-primary active:scale-90"
      >
        <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </button>
      <div className="min-w-0">
        <h2 className="text-base font-bold text-primary">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function MiniStat({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-[11px] text-muted-foreground">{title}</p>
      <p
        className={`mt-2 text-sm font-bold ${
          tone === "bad" ? "text-destructive" : tone === "good" ? "text-gold" : "text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-primary-foreground/60">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 gap-1">
      <button
        onClick={onEdit}
        aria-label="تعديل"
        className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background text-primary active:scale-90"
      >
        <Pencil className="h-4 w-4" strokeWidth={1.8} />
      </button>
      <button
        onClick={onDelete}
        aria-label="حذف"
        className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background text-destructive active:scale-90"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: "text" | "number" | "date";
  wide?: boolean;
}) {
  return (
    <label className={wide ? "col-span-2 block" : "block"}>
      <span className="mb-2 block text-[11px] font-semibold text-muted-foreground">{label}</span>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
      />
    </label>
  );
}

type SheetField = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  wide?: boolean;
};

function FormSheet({
  title,
  fields,
  initial,
  requiredKey,
  onClose,
  onSave,
}: {
  title: string;
  fields: SheetField[];
  initial: Record<string, string>;
  requiredKey: string;
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const ready = (values[requiredKey] ?? "").trim().length > 1;

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="animate-rise max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-luxe">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-primary">{title}</p>
          <button onClick={onClose} aria-label="إغلاق" className="active:scale-90">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {fields.map((f) => (
            <label key={f.key} className={f.wide ? "col-span-2 block" : "block"}>
              <span className="mb-2 block text-[11px] font-semibold text-muted-foreground">
                {f.label}
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
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
                />
              )}
            </label>
          ))}
        </div>

        <button
          disabled={!ready}
          onClick={() => onSave(values)}
          className="mt-4 w-full rounded-2xl bg-goldish py-3 text-sm font-bold text-accent-foreground shadow-goldish active:scale-[0.97] disabled:opacity-40"
        >
          حفظ
        </button>
      </div>
    </div>
  );
}
