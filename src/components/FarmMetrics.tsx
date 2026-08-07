import { usePersistentState } from "@/lib/persist";
import type { FarmKind } from "@/lib/farm";

type RecordItem = { id: string; [key: string]: string };

const arNum = (n: number) => n.toLocaleString("ar-EG");

const sum = (list: RecordItem[], key: string) =>
  list.reduce((s, r) => s + (Number(r[key]) || 0), 0);

/**
 * مؤشرات عامة (مالية ومخزون) للمزارع غير الدواجن — تُحسب من السجلات المحفوظة محلياً.
 */
export function FarmMetrics({
  farmId,
  kind,
  currencySymbol,
  income,
  expenses,
  onOpenRecords,
}: {
  farmId: string;
  kind: FarmKind;
  currencySymbol: string;
  income: number;
  expenses: number;
  onOpenRecords: () => void;
}) {
  const [records] = usePersistentState<Record<string, RecordItem[]>>(
    `agripulse_records_${farmId}`,
    { poultry: [], livestock: [], crops: [] },
  );

  const net = income - expenses;
  const margin = income > 0 ? Math.round((net / income) * 100) : 0;

  const livestock = records["livestock"] ?? [];
  const crops = records["crops"] ?? [];

  const rows =
    kind === "crops"
      ? [
          { label: "عدد المحاصيل المزروعة", value: `${arNum(crops.length)} محصول` },
          { label: "المساحة الإجمالية", value: `${arNum(sum(crops, "area"))} دونم` },
          {
            label: "متوسط تكلفة الدونم",
            value: `${arNum(
              sum(crops, "area") > 0 ? Math.round(expenses / sum(crops, "area")) : 0,
            )} ${currencySymbol}`,
          },
        ]
      : kind === "livestock"
        ? [
            { label: "عدد المجموعات", value: `${arNum(livestock.length)} مجموعة` },
            { label: "إجمالي الرؤوس", value: `${arNum(sum(livestock, "count"))} رأس` },
            {
              label: "متوسط تكلفة الرأس",
              value: `${arNum(
                sum(livestock, "count") > 0
                  ? Math.round(expenses / sum(livestock, "count"))
                  : 0,
              )} ${currencySymbol}`,
            },
            {
              label: "حالات تحت العلاج",
              value: `${arNum(
                livestock.filter((r) => (r["health"] ?? "").includes("علاج")).length,
              )} حالة`,
            },
          ]
        : [
            { label: "سجلات المزرعة", value: `${arNum(Object.values(records).flat().length)} سجل` },
          ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-bold text-primary">
          {kind === "crops" ? "🌾 ملخص المحاصيل والمالية" : "🐐 ملخص القطيع والمالية"}
        </h2>
        <div className="mt-4 space-y-3">
          <Row
            label="الربح الصافي"
            value={`${arNum(net)} ${currencySymbol}`}
            tone={net >= 0 ? "good" : "bad"}
          />
          <Row label="هامش الربح" value={`${arNum(margin)}٪`} tone={margin >= 0 ? "good" : "bad"} />
          {rows.map((r) => (
            <Row key={r.label} label={r.label} value={r.value} />
          ))}
        </div>
        <button
          onClick={onOpenRecords}
          className="mt-4 w-full rounded-2xl bg-forest py-3 text-sm font-bold text-primary-foreground shadow-luxe active:scale-[0.98]"
        >
          {kind === "crops" ? "إدارة المحاصيل والمساحات" : "إدارة القطيع والمجموعات"}
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <span className="min-w-0 truncate text-sm text-foreground">{label}</span>
      <span
        className={`shrink-0 text-sm font-bold ${
          tone === "good" ? "text-leaf" : tone === "bad" ? "text-destructive" : "text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
