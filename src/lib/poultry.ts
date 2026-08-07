/** أدوات مزارع الدواجن: تواريخ، إحصاءات شهرية، وتوزيع الديون على دفتر الحسابات. */

export const TRAYS_PER_CRATE = 12;

export type Allocation = { key: string; name: string; amount: number };

export type EggSale = {
  id: string;
  date: string;
  crates: string;
  pricePerCrate: string;
  price: string;
  buyer: string;
  allocations?: Allocation[];
};

export type FeedEntry = {
  id: string;
  date: string;
  item: string;
  weight: string;
  unit: string;
  price: string;
  trader: string;
};

export const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export const uid = () => Math.random().toString(36).slice(2, 9);
export const today = () => new Date().toISOString().slice(0, 10);
export const num = (v: unknown) => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};

export const arNum = (v: number | string) => {
  const n = Number(v);
  return isNaN(n) ? String(v || "—") : n.toLocaleString("ar-EG", { maximumFractionDigits: 2 });
};

export const arDate = (v: string) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
};

export const arFullDate = (d: Date) =>
  d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });

/** هل التاريخ داخل الشهر الميلادي الحالي؟ */
export function isThisMonth(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export const monthLabel = () =>
  new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" });

/** الموعد القادم = آخر بيعة + التكرار بالأيام (أو اليوم إن لم توجد بيعات). */
export function nextSaleInfo(sales: EggSale[], intervalDays: number) {
  const dates = sales
    .map((s) => new Date(s.date))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  const last = dates[0] ?? null;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(new Date());

  let next = last ? startOfDay(new Date(last.getTime())) : todayStart;
  if (last) {
    next.setDate(next.getDate() + Math.max(1, intervalDays));
    // إن فات الموعد نتقدّم بالتكرار حتى نصل لموعد قادم
    while (next.getTime() < todayStart.getTime()) {
      next = new Date(next.getTime());
      next.setDate(next.getDate() + Math.max(1, intervalDays));
    }
  }

  const daysLeft = Math.round((next.getTime() - todayStart.getTime()) / 86400000);
  return { last, next, daysLeft, dayName: DAYS[next.getDay()]! };
}

/* ------------------------- دفتر الحسابات (قراءة/تسديد) ------------------------- */

type LedgerEntry = { id: string; credit: number; debit: number; date: string; note: string };
type LedgerPerson = { id: string; name: string; opening?: number; entries: LedgerEntry[] };
type LedgerCat = { id: string; emoji: string; label: string; people: LedgerPerson[] };

const ledgerKey = (farmId: string) => `agripulse_ledger_${farmId}_poultry`;

function readLedger(farmId: string): LedgerCat[] {
  try {
    const raw = window.localStorage.getItem(ledgerKey(farmId));
    return raw ? (JSON.parse(raw) as LedgerCat[]) : [];
  } catch {
    return [];
  }
}

export type Creditor = {
  key: string; // catId:personId
  catId: string;
  personId: string;
  name: string;
  category: string;
  emoji: string;
  owed: number;
};

/** الجهات التي للمزرعة عليها ديون (عليه). */
export function listCreditors(farmId: string): Creditor[] {
  const out: Creditor[] = [];
  for (const c of readLedger(farmId)) {
    for (const p of c.people ?? []) {
      const net = (p.entries ?? []).reduce(
        (s, e) => s + num(e.credit) - num(e.debit),
        num(p.opening ?? 0),
      );
      if (net < 0)
        out.push({
          key: `${c.id}:${p.id}`,
          catId: c.id,
          personId: p.id,
          name: p.name,
          category: c.label,
          emoji: c.emoji,
          owed: Math.abs(net),
        });
    }
  }
  return out.sort((a, b) => b.owed - a.owed);
}

/** تسجيل تسديدات على دفتر الحسابات (يعمل بالكامل بدون إنترنت). */
export function applyAllocations(farmId: string, allocations: Allocation[], note: string) {
  const paid = allocations.filter((a) => a.amount > 0);
  if (paid.length === 0) return;
  const ledger = readLedger(farmId);
  for (const a of paid) {
    const [catId, personId] = a.key.split(":");
    const cat = ledger.find((c) => c.id === catId);
    const person = cat?.people?.find((p) => p.id === personId);
    if (!person) continue;
    person.entries = [
      ...(person.entries ?? []),
      { id: uid(), credit: a.amount, debit: 0, date: today(), note },
    ];
  }
  try {
    window.localStorage.setItem(ledgerKey(farmId), JSON.stringify(ledger));
  } catch {
    /* التخزين محجوب */
  }
}
