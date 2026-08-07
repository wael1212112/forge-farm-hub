import { useState } from "react";
import { X, Plus, Trash2, Check } from "lucide-react";
import type { Farm } from "./SettingsSheet";

/** لوحة «مزارعي» — إنشاء وحفظ والتنقل بين عدة مزارع */
export function MyFarmsSheet({
  open,
  onClose,
  farms,
  activeFarmId,
  onSelect,
  onCreate,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  farms: Farm[];
  activeFarmId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");

  if (!open) return null;

  const ready = name.trim().length > 1;

  return (
    <div dir="rtl" className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="animate-rise relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-border bg-background px-6 pb-8 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">🐓 مزارع الدواجن</h2>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          كل مزرعة تحتفظ بحساباتها وسجلاتها وتشخيصاتها بشكل مستقل — اختر مزرعة للانتقال إليها فوراً.
        </p>

        {farms.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            لا توجد مزارع محفوظة بعد — أضف أول مزرعة أدناه.
          </p>
        ) : (
          <ul className="mt-5 space-y-2">
            {farms.map((f) => {
              const active = f.id === activeFarmId;
              return (
                <li
                  key={f.id}
                  className={`flex items-center gap-2 rounded-2xl border p-3 ${
                    active ? "border-gold bg-secondary shadow-goldish" : "border-border bg-card"
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelect(f.id);
                      onClose();
                    }}
                    className="min-w-0 flex-1 text-right"
                  >
                    <span className="block truncate text-sm font-bold text-primary">
                      {f.emoji} {f.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {f.label}
                    </span>
                  </button>
                  {active ? (
                    <Check className="h-4 w-4 shrink-0 text-gold" />
                  ) : (
                    <button
                      onClick={() => onDelete(f.id)}
                      aria-label="حذف المزرعة"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-background text-destructive active:scale-90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-bold text-primary">إضافة مزرعة دواجن جديدة</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: مزرعة الأمل للدواجن"
            className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
          />
          <button
            disabled={!ready}
            onClick={() => {
              onCreate(name.trim());
              setName("");
              onClose();
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-goldish py-3 text-sm font-bold text-accent-foreground shadow-goldish active:scale-[0.97] disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> حفظ المزرعة والانتقال إليها
          </button>
        </div>
      </div>
    </div>
  );
}
