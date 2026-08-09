import { useMemo, useState } from "react";
import {
  ArrowRight,
  Plus,
  Trash2,
  Pencil,
  Phone,
  X,
  BookUser,
  Check,
  FileDown,
  Share2,
} from "lucide-react";

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
  farmName = "مزرعة دواجن",
}: {
  farmId: string;
  currencySymbol: string;
  farmName?: string;
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
        farmName={farmName}
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
  farmName,
  onBack,
  onChange,
  onEdit,
  editor,
}: {
  account: LedgerAccount;
  currencySymbol: string;
  farmName: string;
  onBack: () => void;
  onChange: (patch: Partial<LedgerAccount>) => void;
  onEdit: () => void;
  editor: React.ReactNode;
}) {
  const [busy, setBusy] = useState<"pdf" | "share" | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);

  const entries = account.entries ?? [];

  const rows = useMemo(() => {
    let running = num(account.opening);
    return entries.map((e) => {
      running += e.type === "credit" ? num(e.amount) : -num(e.amount);
      return { entry: e, running };
    });
  }, [entries, account.opening]);

  const final = balanceOf(account);

  const patchEntry = (id: string, patch: Partial<LedgerEntry>) =>
    onChange({ entries: entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });

  const removeEntry = (id: string) =>
    onChange({ entries: entries.filter((e) => e.id !== id) });

  /** السطر الجديد يُضاف فقط بالزر الصريح — لا توليد تلقائي */
  const addRow = () => onChange({ entries: [...entries, { ...emptyEntry(), id: uid() }] });



  const dates = entries
    .map((e) => new Date(e.date).getTime())
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b);
  const rangeLabel =
    dates.length > 0
      ? `من تاريخ ${arDate(new Date(dates[0]!).toISOString().slice(0, 10))} إلى تاريخ ${arDate(
          new Date(dates[dates.length - 1]!).toISOString().slice(0, 10),
        )}`
      : `بتاريخ ${arDate(today())}`;

  const pdfPayload = () => ({
    traderName: account.name,
    role: account.role,
    phone: account.phone,
    farmName,
    rangeLabel,
    rows: rows.map(({ entry, running }) => ({
      date: arDate(entry.date),
      details: entry.details || (entry.type === "credit" ? "مبيع" : "قبض"),
      credit: entry.type === "credit" ? `${arNum(entry.amount)} ${currencySymbol}` : "—",
      debit: entry.type === "debit" ? `${arNum(entry.amount)} ${currencySymbol}` : "—",
      balance: `${arNum(Math.abs(running))} ${running < 0 ? "عليه" : "له"}`,
    })),
    finalLabel: balanceLabel(final, currencySymbol),
    fileName: `كشف-حساب-${account.name.replace(/\s+/g, "-")}`,
  });

  const doExport = async (mode: "pdf" | "share") => {
    if (busy) return;
    setBusy(mode);
    try {
      const { downloadStatementPdf, shareStatementPdf } = await import("@/lib/pdf");
      const data = pdfPayload();
      if (mode === "pdf") await downloadStatementPdf(data);
      else await shareStatementPdf(data);
    } catch (err) {
      console.error("pdf-export-failed", err);
      window.alert("تعذّر إنشاء ملف PDF — أعد المحاولة.");
    } finally {
      setBusy(null);
    }
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

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => doExport("pdf")}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 rounded-2xl bg-goldish py-3.5 text-sm font-bold text-accent-foreground shadow-goldish active:scale-[0.97] disabled:opacity-60"
        >
          <FileDown className="h-4 w-4" /> {busy === "pdf" ? "جارٍ التصدير..." : "تصدير PDF"}
        </button>
        <button
          onClick={() => doExport("share")}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-bold text-primary active:scale-[0.97] disabled:opacity-60"
        >
          <Share2 className="h-4 w-4" /> {busy === "share" ? "جارٍ التحضير..." : "مشاركة الكشف"}
        </button>
      </div>

      <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        اكتب مباشرة داخل خلايا الجدول — يُضاف سطر جديد تلقائياً في الأسفل، ويُحدَّث الرصيد التراكمي
        لحظياً.
      </p>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] text-right text-xs">
            <thead className="bg-secondary/70 text-[11px] text-muted-foreground">
              <tr>
                <th className="px-2 py-2.5 font-semibold">التاريخ</th>
                <th className="px-2 py-2.5 font-semibold">التفاصيل</th>
                <th className="px-2 py-2.5 font-semibold">له (مبيع)</th>
                <th className="px-2 py-2.5 font-semibold">عليه (قبض)</th>
                <th className="px-2 py-2.5 font-semibold">الرصيد</th>
                <th className="px-1 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ entry, running }) => (
                <tr key={entry.id} className="border-t border-border/60">
                  <td className="px-1 py-1.5">
                    <input
                      type="date"
                      aria-label="تاريخ الحركة"
                      value={entry.date}
                      onChange={(e) => patchEntry(entry.id, { date: e.target.value })}
                      className="cell-input w-[8.5rem]"
                    />
                  </td>
                  <td className="px-1 py-1.5">
                    <input
                      aria-label="تفاصيل الحركة"
                      value={entry.details}
                      placeholder={entry.type === "credit" ? "مبيع" : "قبض"}
                      onChange={(e) => patchEntry(entry.id, { details: e.target.value })}
                      className="cell-input min-w-[7rem]"
                    />
                  </td>
                  <td className="px-1 py-1.5">
                    <input
                      aria-label="مبلغ له"
                      inputMode="decimal"
                      value={entry.type === "credit" ? entry.amount : ""}
                      onChange={(e) =>
                        patchEntry(entry.id, { type: "credit", amount: e.target.value })
                      }
                      className="cell-input w-[5.5rem] font-semibold text-primary"
                    />
                  </td>
                  <td className="px-1 py-1.5">
                    <input
                      aria-label="مبلغ عليه"
                      inputMode="decimal"
                      value={entry.type === "debit" ? entry.amount : ""}
                      onChange={(e) =>
                        patchEntry(entry.id, { type: "debit", amount: e.target.value })
                      }
                      className="cell-input w-[5.5rem] font-semibold text-destructive"
                    />
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 font-bold text-foreground">
                    {arNum(Math.abs(running))} {running < 0 ? "عليه" : "له"}
                  </td>
                  <td className="px-1 py-1.5">
                    <button
                      onClick={() => removeEntry(entry.id)}
                      aria-label="حذف الحركة"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive active:scale-90"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-3 py-3">
          <button
            onClick={addRow}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold bg-secondary py-3 text-sm font-bold text-primary active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> إضافة سطر جديد
          </button>
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
