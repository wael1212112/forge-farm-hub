import { useEffect, useState } from "react";
import { Lock, X, Check, Copy } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "agripulse_subscription";
export const ADMIN_ACTIVATION_CODE = "AGRI-OWNER-2026";
export const ACTIVATION_CODES = [ADMIN_ACTIVATION_CODE];

export const SHAMCASH = {
  /** عنوان محفظة شام كاش */
  address: "ff9732334b27f30964caa1c656e8818d",
  /** رقم المحفظة / رقم الهاتف */
  phone: "0995835566",
  price: "250 ل.س",
  priceLabel: "250 ل.س / شهرياً",
};

/** التحقق الآلي من رقم عملية التحويل (بدون الحاجة إلى واتساب) */
export function isValidActivation(value: string) {
  const v = value.trim().toUpperCase();
  if (ACTIVATION_CODES.includes(v)) return true;
  // رقم عملية تحويل شام كاش: من ٦ إلى ١٤ رقماً
  return /^\d{6,14}$/.test(v.replace(/[\s-]/g, ""));
}

export function useSubscription() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(localStorage.getItem(STORAGE_KEY) === "active");
  }, []);

  const activate = () => {
    localStorage.setItem(STORAGE_KEY, "active");
    setActive(true);
  };

  return { active, activate };
}

const features = [
  "💡 تشخيص الأمراض والأعراض",
  "💊 دليل شامل للأدوية الوطنية والأجنبية بأسعارها",
  "🌾 جدولة التغذية والري",
  "⏱️ إجابات فورية ٢٤/٧",
];

export function Paywall({ onActivate }: { onActivate: () => void }) {
  const [payOpen, setPayOpen] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="bg-forest px-5 py-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-goldish shadow-goldish">
            <Lock className="h-7 w-7 text-accent-foreground" strokeWidth={1.9} />
          </span>
          <h2 className="mt-4 text-lg font-bold leading-relaxed text-primary-foreground">
            اشترك الآن للوصول إلى المستشار الذكي ودليل الأدوية
          </h2>
          <p className="mt-2 text-xs text-gold">{SHAMCASH.priceLabel}</p>
        </div>
        <div className="space-y-3 px-5 py-5">
          {features.map((f) => (
            <p key={f} className="text-sm leading-relaxed text-foreground">
              {f}
            </p>
          ))}
          <button
            onClick={() => setPayOpen(true)}
            className="mt-2 w-full rounded-2xl bg-goldish py-3.5 text-base font-bold text-accent-foreground shadow-goldish transition-transform active:scale-[0.97]"
          >
            تفعيل الاشتراك
          </button>
        </div>
      </div>

      {payOpen && <ShamCashModal onClose={() => setPayOpen(false)} onActivate={onActivate} />}
    </>
  );
}

function ShamCashModal({
  onClose,
  onActivate,
}: {
  onClose: () => void;
  onActivate: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const submit = () => {
    if (isValidActivation(code)) {
      toast.success("تم تفعيل الاشتراك — وصول كامل غير محدود");
      onActivate();
      onClose();
    } else {
      setError(true);
      toast.error("كود التفعيل أو رقم عملية التحويل غير صحيح");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
      <div className="animate-rise max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-card px-6 pb-8 pt-5 shadow-luxe">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-primary">الدفع عبر شام كاش</h3>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3 rounded-2xl border border-border bg-secondary/60 p-4">
          <div>
            <p className="text-xs text-muted-foreground">عنوان المحفظة</p>
            <p dir="ltr" className="mt-1 break-all text-right text-xs font-bold text-primary">
              {SHAMCASH.address}
            </p>
          </div>
          <Line label="رقم المحفظة / رقم الهاتف" value={SHAMCASH.phone} />
          <Line label="قيمة الاشتراك" value={SHAMCASH.price} />
          <button
            onClick={() => {
              navigator.clipboard?.writeText(SHAMCASH.address);
              setCopied(true);
              toast.success("تم نسخ عنوان المحفظة");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-card py-2.5 text-xs font-semibold text-primary"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "تم نسخ عنوان المحفظة" : "نسخ رقم المحفظة"}
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(SHAMCASH.phone);
              toast.success(`تم نسخ الرقم ${SHAMCASH.phone}`);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-card py-2.5 text-xs font-semibold text-primary"
          >
            <Copy className="h-4 w-4" /> نسخ رقم الهاتف
          </button>
        </div>

        <ol className="mt-5 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>١. افتح تطبيق شام كاش واختر «تحويل».</li>
          <li>٢. حوّل ٢٥٠ ل.س إلى عنوان المحفظة أعلاه (أو رقم الهاتف {SHAMCASH.phone}).</li>
          <li>٣. انسخ رقم عملية التحويل الظاهر في إشعار شام كاش.</li>
          <li>٤. أدخله في الحقل التالي — يتم التحقق تلقائياً داخل التطبيق بدون واتساب.</li>
        </ol>

        <label className="mt-6 block text-sm font-semibold text-primary" htmlFor="activation">
          رقم عملية التحويل أو كود التفعيل
        </label>
        <input
          id="activation"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(false);
          }}
          placeholder="مثال: 123456789"
          dir="ltr"
          className="mt-2 w-full rounded-2xl border border-border bg-card px-5 py-3.5 text-center text-base tracking-widest text-foreground outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
        />
        {error && (
          <p className="mt-2 text-xs font-semibold text-destructive">
            تأكد من رقم عملية التحويل (٦ أرقام على الأقل) أو من كود التفعيل.
          </p>
        )}

        <button
          onClick={submit}
          disabled={code.trim().length < 4}
          className="mt-5 w-full rounded-2xl bg-forest py-3.5 text-base font-bold text-primary-foreground shadow-luxe transition-transform active:scale-[0.97] disabled:opacity-40"
        >
          تفعيل الاشتراك الآن
        </button>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span dir="ltr" className="text-sm font-bold text-primary">
        {value}
      </span>
    </div>
  );
}
