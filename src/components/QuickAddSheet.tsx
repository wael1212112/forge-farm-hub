import { useState } from "react";
import { X } from "lucide-react";

export function QuickAddSheet({
  open,
  onClose,
  currencySymbol,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  currencySymbol: string;
  onSave: (entry: { kind: "in" | "out" | "note"; amount: number; text: string }) => void;
}) {
  const [kind, setKind] = useState<"in" | "out" | "note">("in");
  const [amount, setAmount] = useState("");
  const [text, setText] = useState("");

  if (!open) return null;

  const submit = () => {
    const value = Number(amount) || 0;
    if (kind !== "note" && value <= 0) return;
    if (kind === "note" && text.trim().length < 2) return;
    onSave({ kind, amount: value, text: text.trim() });
    setAmount("");
    setText("");
    onClose();
  };

  const kinds = [
    { id: "in" as const, label: "إيراد", emoji: "💰" },
    { id: "out" as const, label: "مصروف", emoji: "🧾" },
    { id: "note" as const, label: "ملاحظة", emoji: "📝" },
  ];

  return (
    <div dir="rtl" className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="animate-rise relative z-10 w-full max-w-md rounded-t-[2rem] border border-border bg-background p-6 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">إضافة سريعة</h2>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {kinds.map((k) => (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              className={`rounded-2xl border py-3 text-sm font-semibold transition-all active:scale-[0.97] ${
                kind === k.id
                  ? "border-gold bg-secondary text-primary shadow-goldish"
                  : "border-border bg-card text-foreground"
              }`}
            >
              <span className="block text-lg">{k.emoji}</span>
              {k.label}
            </button>
          ))}
        </div>

        {kind !== "note" && (
          <div className="mt-5">
            <label className="text-sm font-semibold text-primary" htmlFor="qa-amount">
              المبلغ ({currencySymbol})
            </label>
            <input
              id="qa-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="mt-2 w-full rounded-2xl border border-border bg-card px-5 py-3.5 text-base outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
            />
          </div>
        )}

        <div className="mt-4">
          <label className="text-sm font-semibold text-primary" htmlFor="qa-text">
            {kind === "note" ? "الملاحظة" : "الوصف"}
          </label>
          <input
            id="qa-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={kind === "note" ? "مثال: تنظيف العنابر غداً" : "مثال: بيع بيض"}
            className="mt-2 w-full rounded-2xl border border-border bg-card px-5 py-3.5 text-base outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
          />
        </div>

        <button
          onClick={submit}
          className="mt-6 w-full rounded-2xl bg-forest py-4 text-base font-bold text-primary-foreground shadow-luxe transition-transform active:scale-[0.97]"
        >
          حفظ
        </button>
      </div>
    </div>
  );
}
