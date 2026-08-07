import { useState } from "react";
import {
  X,
  Plus,
  Check,
  Sun,
  Moon,
  Bell,
  Wallet,
  Tractor,
  LogOut,
  Languages,
  Type,
  Download,
  Trash2,
} from "lucide-react";
import { type FarmKind } from "@/lib/farm";
import { translator, type Lang } from "@/lib/i18n";

export type Farm = { id: string; name: string; emoji: string; label: string; kind?: FarmKind };
export type Currency = "syp" | "usd";

export const currencyLabel: Record<Currency, string> = {
  syp: "ل.س",
  usd: "$",
};


export function SettingsSheet({
  open,
  onClose,
  farms,
  activeFarmId,
  onSelectFarm,
  onAddFarm,
  accountName,
  onSignOut,
  onDeleteFarm,
  currency,
  onCurrencyChange,
  dark,
  onDarkChange,
  notifications,
  onNotificationsChange,
  lang,
  onLangChange,
  fontScale,
  onFontScaleChange,
  onExportData,
  onClearData,
}: {
  open: boolean;
  onClose: () => void;
  farms: Farm[];
  activeFarmId: string;
  onSelectFarm: (id: string) => void;
  onAddFarm: (name: string) => void;
  accountName?: string;
  onSignOut: () => void;
  onDeleteFarm: () => void;

  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  dark: boolean;
  onDarkChange: (v: boolean) => void;
  notifications: { meds: boolean; ledger: boolean };
  onNotificationsChange: (n: { meds: boolean; ledger: boolean }) => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
  fontScale: number;
  onFontScaleChange: (v: number) => void;
  onExportData: () => void;
  onClearData: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const t = translator(lang);

  if (!open) return null;

  const submitFarm = () => {
    if (newName.trim().length < 2) return;
    onAddFarm(newName.trim());
    setNewName("");
    setAdding(false);
  };

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />

      <div className="animate-rise relative z-10 max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-border bg-background pb-8">
        <div className="sticky top-0 flex items-center justify-between rounded-t-[2rem] bg-forest px-6 pt-6 pb-5">
          <div>
            <p className="text-xs tracking-widest text-primary-foreground/60">AGRIPULSE</p>
            <h2 className="text-xl font-bold text-primary-foreground">{t("settings")}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق الإعدادات"
            className="grid h-10 w-10 place-items-center rounded-xl bg-goldish text-accent-foreground shadow-goldish transition-transform active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 pt-5">
          <Section icon={<Tractor className="h-4 w-4" />} title="إدارة المزارع">
            <div className="space-y-2">
              {farms.map((f) => {
                const active = f.id === activeFarmId;
                return (
                  <button
                    key={f.id}
                    onClick={() => onSelectFarm(f.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-right transition-all active:scale-[0.98] ${
                      active ? "border-gold bg-secondary" : "border-border bg-card"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="text-2xl">{f.emoji}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {f.name}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">{f.label}</span>
                      </span>
                    </span>
                    {active && (
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-goldish text-accent-foreground">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {adding ? (
              <div className="mt-3 flex gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitFarm()}
                  placeholder="اسم المزرعة الجديدة"
                  className="min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
                />
                <button
                  onClick={submitFarm}
                  className="shrink-0 rounded-xl bg-forest px-4 text-sm font-bold text-primary-foreground"
                >
                  حفظ
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gold bg-secondary/60 py-3 text-sm font-bold text-primary transition-transform active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                إضافة مزرعة جديدة
              </button>
            )}
          </Section>

          <Section icon={<Tractor className="h-4 w-4" />} title="المزرعة الحالية">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {accountName ? `المزرعة: ${accountName}` : "بياناتك محفوظة على هذا الجهاز"} — التطبيق
              مخصص حصراً لمزارع الدواجن 🐓، وكل مزرعة تحتفظ ببياناتها بشكل مستقل.
            </p>
            <button
              onClick={onDeleteFarm}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-card py-3 text-sm font-bold text-destructive transition-transform active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" />
              حذف المزرعة الحالية
            </button>
            <button
              onClick={onSignOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4" />
              العودة إلى قائمة المزارع
            </button>
          </Section>



          <Section icon={<Wallet className="h-4 w-4" />} title="العملة">
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { id: "syp" as Currency, title: "الليرة السورية (الافتراضية)", sub: "ل.س" },
                  { id: "usd" as Currency, title: "الدولار", sub: "$" },
                ]
              ).map((c) => {
                const active = currency === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => onCurrencyChange(c.id)}
                    className={`rounded-2xl border p-4 text-right transition-all active:scale-[0.97] ${
                      active ? "border-gold bg-secondary shadow-goldish" : "border-border bg-card"
                    }`}
                  >
                    <span className="block text-2xl font-bold text-primary">{c.sub}</span>
                    <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                      {c.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section icon={<Languages className="h-4 w-4" />} title={t("language")}>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { id: "ar" as Lang, title: "العربية", sub: "AR" },
                  { id: "en" as Lang, title: "English", sub: "EN" },
                ]
              ).map((l) => {
                const active = lang === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => onLangChange(l.id)}
                    className={`rounded-2xl border p-4 transition-all active:scale-[0.97] ${
                      active ? "border-gold bg-secondary shadow-goldish" : "border-border bg-card"
                    }`}
                  >
                    <span className="block text-xl font-bold text-primary">{l.sub}</span>
                    <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                      {l.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section
            icon={dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            title={t("appearance")}
          >
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onDarkChange(false)}
                className={`rounded-2xl border p-4 transition-all active:scale-[0.97] ${
                  !dark ? "border-gold bg-secondary shadow-goldish" : "border-border bg-card"
                }`}
              >
                <span className="text-xl">🌿</span>
                <span className="mt-2 block text-sm font-semibold text-foreground">
                  {t("lightMode")}
                </span>
              </button>
              <button
                onClick={() => onDarkChange(true)}
                className={`rounded-2xl border p-4 transition-all active:scale-[0.97] ${
                  dark ? "border-gold bg-secondary shadow-goldish" : "border-border bg-card"
                }`}
              >
                <span className="text-xl">🌙</span>
                <span className="mt-2 block text-sm font-semibold text-foreground">
                  {t("darkMode")}
                </span>
              </button>
            </div>
          </Section>

          <Section icon={<Type className="h-4 w-4" />} title={t("textSize")}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onFontScaleChange(Math.max(0.85, Math.round((fontScale - 0.05) * 100) / 100))}
                aria-label={t("smaller")}
                className="h-11 w-11 shrink-0 rounded-xl border border-border bg-card text-lg font-bold text-primary active:scale-95"
              >
                A-
              </button>
              <div className="min-w-0 flex-1 text-center">
                <p className="text-sm font-bold text-primary">{Math.round(fontScale * 100)}%</p>
                <p className="text-[11px] text-muted-foreground">
                  {lang === "ar" ? "حجم النص في كل التطبيق" : "App-wide text size"}
                </p>
              </div>
              <button
                onClick={() => onFontScaleChange(Math.min(1.4, Math.round((fontScale + 0.05) * 100) / 100))}
                aria-label={t("bigger")}
                className="h-11 w-11 shrink-0 rounded-xl border border-border bg-card text-lg font-bold text-primary active:scale-95"
              >
                A+
              </button>
            </div>
          </Section>

          <Section icon={<Bell className="h-4 w-4" />} title={t("notifications")}>
            <ToggleRow
              label={lang === "ar" ? "تنبيهات الأدوية والتحصين" : "Medicine & vaccination reminders"}
              hint={lang === "ar" ? "تذكير بمواعيد اللقاحات والعلاج" : "Reminders for vaccines and treatments"}
              value={notifications.meds}
              onChange={(v) => onNotificationsChange({ ...notifications, meds: v })}
            />
            <ToggleRow
              label={lang === "ar" ? "مواعيد سداد الحسابات" : "Payment due reminders"}
              hint={lang === "ar" ? "تذكير بتواريخ الدفع والمستحقات" : "Reminders for dues and payments"}
              value={notifications.ledger}
              onChange={(v) => onNotificationsChange({ ...notifications, ledger: v })}
            />
          </Section>

          <Section icon={<Download className="h-4 w-4" />} title={t("data")}>
            <button
              onClick={onExportData}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3 text-sm font-bold text-primary-foreground active:scale-[0.98]"
            >
              <Download className="h-4 w-4" /> {t("exportData")}
            </button>
            <button
              onClick={onClearData}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive bg-card py-3 text-sm font-bold text-destructive active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" /> {t("clearCache")}
            </button>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {t("clearCacheHint")}
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-primary">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-primary">
          {icon}
        </span>
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 first:pt-0 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          value ? "bg-goldish" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow-sm transition-all ${
            value ? "right-1" : "right-6"
          }`}
        />
      </button>
    </div>
  );
}
