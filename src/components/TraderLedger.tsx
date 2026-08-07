import { useMemo, useState } from "react";
import { ArrowRight, Plus, Trash2, Pencil, Phone, X, BookUser, Check } from "lucide-react";
import { usePersistentState } from "@/lib/persist";
import { uid, today, num, arNum, arDate } from "@/lib/poultry";

/* ------------------------------- الأنواع ------------------------------- */

export type LedgerRole = "تاجر بيض" | "تاجر علف" | "طبيب" | "عامل" | "أخرى";

export type LedgerEntry = {
  id: string;
  date: string;
  /** credit = له (مبيع) — debit = عليه (قبض/دفعة) */
  type: "credit" | "debit";
  details: string;
  qty: string;
  unitPrice: string;
  amount: string;
};

export type LedgerAccount = {
  id: string;
  name: string;
  role: LedgerRole;
  phone: string;
  opening: string; // رصيد سابق (+ له / - عليه)
  entries: LedgerEntry[];
};

const ROLES: LedgerRole[] = ["تاجر بيض", "تاجر علف", "طبيب", "عامل", "أخرى"];

const emptyAccount = (): LedgerAccount => ({
  id: "",
  name: "",
  role: "تاجر بيض",
  phone: "",
  opening: "0",
  entries: [],
});

const emptyEntry = (): LedgerEntry => ({
  id: "",
  date: today(),
  type: "credit",
  details: "",
  qty: "",
  unitPrice: "",
  amount: "",
});

function balanceOf(a: LedgerAccount) {
  return (a.entries ?? []).reduce(
    (s, e) => s + (e.type === "credit" ? num(e.amount) : -num(e.amount)),
    num(a.opening),
  );
}

function balanceLabel(v: number, symbol: string) {
  if (Math.abs(v) < 0.005) return `مُسدّد بالكامل — ٠ ${symbol}`;
  return `${v > 0 ? "له" : "عليه"} ${arNum(Math.abs(v))} ${symbol}`;
}

/* ------------------------------ الواجهة الرئيسية ------------------------------ */

export function TraderLedger({
  farmId,
  currencySymbol,
}: {
  farmId: string;
  currencySymbol: string;
}) {
  const [accounts, setAccounts, loaded] = usePersistentState<LedgerAccount[]>(
    `agripulse_accounts_${farmId}`,
    [],
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<LedgerAccount | null>(null);

  const opened = accounts.find((a) => a.id === openId) ?? null;

  const saveAccount = () => {
    if (!form) return;
    const name = form.name.trim() || "حساب بدون اسم";
    const clean: LedgerAccount = { ...form, name };
    setAccounts((prev) =>
      clean.id
        ? prev.map((a) => (a.id === clean.id ? { ...a, ...clean } : a))
        : [{ ...clean, id: uid(), entries: [] }, ...prev],
    );
    setForm(null);
  };

  const removeAccount = (id: string, name: string) => {
    if (!window.confirm(`سيتم حذف حساب «${name}» وكل حركاته. متابعة؟`)) return;
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setOpenId((cur) => (cur === id ? null : cur));
  };

  const updateAccount = (id: string, patch: Partial<LedgerAccount>) =>
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  if (!loaded) return null;

  if (opened) {
    return (
      <AccountStatement
        account={opened}
        currencySymbol={currencySymbol}
        onBack={() => setOpenId(null)}
        onChange={(patch) => updateAccount(opened.id, patch)}
        onEdit={() => setForm({ ...emptyAccount(), ...opened })}
        editor={
          form ? (
            <AccountForm
              form={form}
              setForm={setForm}
              onSave={saveAccount}
              onClose={() => setForm(null)}
            />
          ) : null
        }
      />
    );
  }

  const totalCredit = accounts.reduce((s, a) => s + Math.max(0, balanceOf(a)), 0);
  const totalDebit = accounts.reduce((s, a) => s + Math.max(0, -balanceOf(a)), 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-primary">دفتر الحسابات</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          أضف كل شخص تتعامل معه، ثم افتح اسمه لتسجيل المبيع والقبض ومتابعة الرصيد التراكمي.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SumCard title="مجموع «له»" value={`${arNum(totalCredit)} ${currencySymbol}`} />
        <SumCard title="مجموع «عليه»" value={`${arNum(totalDebit)} ${currencySymbol}`} />
      </div>

      <button
        onClick={() => setForm(emptyAccount())}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-primary-foreground shadow-luxe active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" /> إضافة حساب / شخص جديد
      </button>

      {accounts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          لا توجد حسابات بعد — ابدأ بإضافة تاجر بيض أو تاجر علف أو طبيب.
        </p>
      ) : (
        <ul className="space-y-3">
          {accounts.map((a) => {
            const bal = balanceOf(a);
            return (
              <li key={a.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <button onClick={() => setOpenId(a.id)} className="min-w-0 flex-1 text-right">
                    <span className="flex items-center gap-2 truncate text-base font-bold text-primary">
                      <BookUser className="h-4 w-4 shrink-0 text-gold" /> {a.name}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {a.role}
                      {a.phone ? ` • ${a.phone}` : ""} — اضغط لكشف الحساب
                    </span>
                    <span
                      className={`mt-2 block text-sm font-bold ${
                        bal > 0
                          ? "text-primary"
                          : bal < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {balanceLabel(bal, currencySymbol)}
                    </span>
                  </button>
                  <button
                    onClick={() => setForm({ ...emptyAccount(), ...a })}
                    aria-label={`تعديل بيانات ${a.name}`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-primary active:scale-90"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeAccount(a.id, a.name)}
                    aria-label={`حذف حساب ${a.name}`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-destructive active:scale-90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {form && (
        <AccountForm
          form={form}
          setForm={setForm}
          onSave={saveAccount}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------ كشف حساب واحد ------------------------------ */

function AccountStatement({
  account,
  currencySymbol,
  onBack,
  onChange,
  onEdit,
  editor,
}: {
  account: LedgerAccount;
  currencySymbol: string;
  onBack: () => void;
  onChange: (patch: Partial<LedgerAccount>) => void;
  onEdit: () => void;
  editor: React.ReactNode;
}) {
  const [draft, setDraft] = useState<LedgerEntry | null>(null);

  const rows = useMemo(() => {
    const sorted = [...(account.entries ?? [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    let running = num(account.opening);
    return sorted.map((e) => {
      running += e.type === "credit" ? num(e.amount) : -num(e.amount);
      return { entry: e, running };
    });
  }, [account.entries, account.opening]);

  const final = balanceOf(account);

  const saveEntry = () => {
    if (!draft) return;
    const amount = num(draft.amount) || num(draft.qty) * num(draft.unitPrice);
    if (amount <= 0) return;
    const clean: LedgerEntry = {
      ...draft,
      amount: String(amount),
      details: draft.details.trim(),
      date: draft.date || today(),
    };
    const entries = account.entries ?? [];
    onChange({
      entries: clean.id
        ? entries.map((e) => (e.id === clean.id ? clean : e))
        : [...entries, { ...clean, id: uid() }],
    });
    setDraft(null);
  };

  const removeEntry = (id: string) => {
    if (!window.confirm("حذف هذه الحركة من كشف الحساب؟")) return;
    onChange({ entries: (account.entries ?? []).filter((e) => e.id !== id) });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-primary active:scale-95"
      >
        <ArrowRight className="h-4 w-4" /> رجوع إلى الحسابات
      </button>

      <div className="rounded-2xl bg-forest p-5 text-primary-foreground shadow-luxe">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{account.name}</p>
            <p className="mt-1 text-[11px] text-primary-foreground/70">{account.role}</p>
            {account.phone && (
              <a
                href={`tel:${account.phone}`}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-gold"
              >
                <Phone className="h-3.5 w-3.5" /> {account.phone}
              </a>
            )}
          </div>
          <button
            onClick={onEdit}
            aria-label="تعديل بيانات الحساب"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-foreground/10 text-primary-foreground active:scale-90"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-4 text-[11px] text-primary-foreground/70">
          رصيد سابق: {balanceLabel(num(account.opening), currencySymbol)}
        </p>
      </div>

      <button
        onClick={() => setDraft(emptyEntry())}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-goldish py-3.5 text-sm font-bold text-accent-foreground shadow-goldish active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" /> إضافة حركة جديدة
      </button>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-right text-xs">
            <thead className="bg-secondary/70 text-[11px] text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-semibold">التاريخ</th>
                <th className="px-3 py-2.5 font-semibold">التفاصيل</th>
                <th className="px-3 py-2.5 font-semibold">له (مبيع)</th>
                <th className="px-3 py-2.5 font-semibold">عليه (قبض)</th>
                <th className="px-3 py-2.5 font-semibold">الرصيد</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    لا توجد حركات بعد.
                  </td>
                </tr>
              ) : (
                rows.map(({ entry, running }) => (
                  <tr key={entry.id} className="border-t border-border/60">
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                      {arDate(entry.date)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="block font-semibold text-foreground">
                        {entry.details || (entry.type === "credit" ? "مبيع" : "قبض")}
                      </span>
                      {num(entry.qty) > 0 && (
                        <span className="block text-[10px] text-muted-foreground">
                          {arNum(entry.qty)} × {arNum(entry.unitPrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-semibold text-primary">
                      {entry.type === "credit" ? arNum(entry.amount) : "—"}
                    </td>
                    <td className="px-3 py-3 font-semibold text-destructive">
                      {entry.type === "debit" ? arNum(entry.amount) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-bold text-foreground">
                      {arNum(Math.abs(running))} {running < 0 ? "عليه" : "له"}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setDraft({ ...emptyEntry(), ...entry })}
                          aria-label="تعديل الحركة"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-primary active:scale-90"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          aria-label="حذف الحركة"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive active:scale-90"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border bg-secondary/50 px-4 py-4 text-center">
          <p className="text-[11px] text-muted-foreground">الرصيد النهائي</p>
          <p
            className={`mt-1 text-xl font-bold ${
              final > 0 ? "text-primary" : final < 0 ? "text-destructive" : "text-foreground"
            }`}
          >
            {balanceLabel(final, currencySymbol)}
          </p>
        </div>
      </div>

      {draft && (
        <Sheet
          title={draft.id ? "✏️ تعديل الحركة" : "➕ حركة جديدة"}
          onClose={() => setDraft(null)}
        >
          <Field label="التاريخ">
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className="input-luxe"
            />
          </Field>

          <p className="mt-4 text-sm font-semibold text-primary">نوع الحركة</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                { id: "credit", label: "مبيع / له (+)" },
                { id: "debit", label: "قبض / دفعة (−)" },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                onClick={() => setDraft({ ...draft, type: o.id })}
                className={`rounded-xl border px-3 py-3 text-xs font-bold ${
                  draft.type === o.id
                    ? "border-gold bg-secondary text-primary"
                    : "border-border bg-card text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <Field label="التفاصيل / البيان">
            <input
              value={draft.details}
              onChange={(e) => setDraft({ ...draft, details: e.target.value })}
              placeholder="مثال: ٢٠ طبق بيض، دفعة نقدية..."
              className="input-luxe"
            />
          </Field>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[11px] text-muted-foreground">الكمية</span>
              <input
                value={draft.qty}
                inputMode="decimal"
                onChange={(e) => setDraft({ ...draft, qty: e.target.value })}
                className="input-luxe mt-1"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] text-muted-foreground">سعر الوحدة</span>
              <input
                value={draft.unitPrice}
                inputMode="decimal"
                onChange={(e) => setDraft({ ...draft, unitPrice: e.target.value })}
                className="input-luxe mt-1"
              />
            </label>
          </div>

          <Field label="المبلغ (يُحسب تلقائياً إن تركته فارغاً)">
            <input
              value={draft.amount}
              inputMode="decimal"
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              placeholder={String(num(draft.qty) * num(draft.unitPrice) || "")}
              className="input-luxe"
            />
          </Field>

          <button
            onClick={saveEntry}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-primary-foreground shadow-luxe active:scale-[0.97]"
          >
            <Check className="h-4 w-4" /> حفظ الحركة
          </button>
        </Sheet>
      )}

      {editor}
    </div>
  );
}

/* ------------------------------ نموذج الحساب ------------------------------ */

function AccountForm({
  form,
  setForm,
  onSave,
  onClose,
}: {
  form: LedgerAccount;
  setForm: (a: LedgerAccount) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet title={form.id ? "✏️ تعديل الحساب" : "👤 حساب جديد"} onClose={onClose}>
      <Field label="الاسم">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="مثال: أبو أحمد"
          className="input-luxe"
        />
      </Field>

      <p className="mt-4 text-sm font-semibold text-primary">الصفة</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setForm({ ...form, role: r })}
            className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${
              form.role === r
                ? "border-gold bg-secondary text-primary"
                : "border-border bg-card text-foreground"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <Field label="رقم الهاتف">
        <input
          value={form.phone}
          inputMode="tel"
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="09xxxxxxxx"
          className="input-luxe"
        />
      </Field>

      <Field label="رصيد سابق (اختياري) — موجب = له، سالب = عليه">
        <input
          value={form.opening}
          inputMode="decimal"
          onChange={(e) => setForm({ ...form, opening: e.target.value })}
          className="input-luxe"
        />
      </Field>

      <button
        onClick={onSave}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-goldish py-3.5 text-sm font-bold text-accent-foreground shadow-goldish active:scale-[0.97]"
      >
        <Check className="h-4 w-4" /> {form.id ? "حفظ التعديلات" : "حفظ الحساب"}
      </button>
    </Sheet>
  );
}

/* --------------------------------- عناصر --------------------------------- */

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div dir="rtl" className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="animate-rise relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-border bg-background px-6 pb-8 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">{title}</h2>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
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

function SumCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-[11px] text-muted-foreground">{title}</p>
      <p className="mt-1.5 text-base font-bold text-primary">{value}</p>
    </div>
  );
}
