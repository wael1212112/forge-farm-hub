import { useState } from "react";
import { Leaf, Plus, Trash2, Pencil, ArrowLeft, Check, X } from "lucide-react";
import type { Farm } from "./SettingsSheet";

/** شاشة الترحيب الأولى — بدون تسجيل دخول أو رموز */
export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <section
      dir="rtl"
      className="animate-rise flex min-h-screen flex-col justify-center bg-forest px-7 py-12"
    >
      <div className="flex flex-col items-center text-center">
        <span className="grid h-20 w-20 place-items-center rounded-3xl bg-goldish shadow-goldish">
          <Leaf className="h-9 w-9 text-accent-foreground" strokeWidth={1.8} />
        </span>
        <h1 className="mt-6 text-3xl font-bold text-primary-foreground">
          Agri<span className="text-gold">Pulse</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">
          مرحباً بك 👋 — تطبيق إدارة مزارع الدواجن: كشوفات حسابات تراكمية، متابعة الأفواج بالأشهر
          والأسابيع، الأدوية، والمستشار الذكي.
        </p>
      </div>

      <ul className="mt-10 space-y-3">
        {[
          "🐓 أضف عدة مزارع وتنقّل بينها بسهولة",
          "📊 كشف حساب تراكمي لكل تاجر مع الرصيد السابق",
          "🐣 عمر الفوج والمدة المتبقية للبيع تُحسب تلقائياً",
          "📴 كل البيانات محفوظة على جهازك وتعمل بدون إنترنت",
        ].map((line) => (
          <li
            key={line}
            className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 px-4 py-3 text-sm text-primary-foreground/85"
          >
            {line}
          </li>
        ))}
      </ul>

      <button
        onClick={onStart}
        className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-goldish py-4 text-base font-bold text-accent-foreground shadow-goldish active:scale-[0.97]"
      >
        الدخول إلى مزارعي <ArrowLeft className="h-5 w-5" />
      </button>
    </section>
  );
}

/** قائمة المزارع — إضافة، تعديل، حذف، ودخول */
export function FarmsScreen({
  farms,
  onOpen,
  onCreate,
  onRename,
  onDelete,
}: {
  farms: Farm[];
  onOpen: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  return (
    <section dir="rtl" className="animate-rise min-h-screen px-6 pb-12 pt-14">
      <span className="text-xs font-bold tracking-widest text-gold">AGRIPULSE 🐓</span>
      <h1 className="mt-2 text-3xl font-bold text-primary">مزارعي</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        اختر مزرعة للدخول إليها، أو أضف مزرعة جديدة. كل مزرعة تحتفظ بحساباتها وأفواجها بشكل مستقل.
      </p>

      {farms.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          لا توجد مزارع بعد — أضف أول مزرعة دواجن أدناه.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {farms.map((f) => (
            <li key={f.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              {editing === f.id ? (
                <div className="flex gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-luxe min-w-0 flex-1"
                  />
                  <button
                    onClick={() => {
                      if (editName.trim().length > 1) onRename(f.id, editName.trim());
                      setEditing(null);
                    }}
                    aria-label="حفظ الاسم"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-goldish text-accent-foreground"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    aria-label="إلغاء"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => onOpen(f.id)} className="min-w-0 flex-1 text-right">
                    <span className="block truncate text-base font-bold text-primary">
                      🐓 {f.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      مزرعة دواجن — اضغط للدخول
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setEditing(f.id);
                      setEditName(f.name);
                    }}
                    aria-label="تعديل اسم المزرعة"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-primary active:scale-90"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`سيتم حذف مزرعة «${f.name}» وبياناتها. متابعة؟`))
                        onDelete(f.id);
                    }}
                    aria-label="حذف المزرعة"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-destructive active:scale-90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-bold text-primary">إضافة مزرعة دواجن جديدة</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: مزرعة الأمل للدواجن"
          className="input-luxe mt-3"
        />
        <button
          disabled={name.trim().length < 2}
          onClick={() => {
            onCreate(name.trim());
            setName("");
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-primary-foreground shadow-luxe active:scale-[0.97] disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> حفظ المزرعة والدخول إليها
        </button>
      </div>
    </section>
  );
}
