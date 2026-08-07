import { useEffect, useState } from "react";
import { Globe, Loader2, X, Save } from "lucide-react";
import { toast } from "sonner";
import { saveDiagnosis } from "./DiagnosisArchive";

export function WebSearchSheet({ query, onClose }: { query: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = (await res.json()) as { result?: string; error?: string };
        if (!alive) return;
        if (!res.ok || !data.result) throw new Error(data.error || "تعذّر البحث.");
        setResult(data.result);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
      <div className="animate-rise max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-card px-6 pb-8 pt-5 shadow-luxe">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-primary">
            <Globe className="h-4 w-4" /> نتائج البحث عبر الإنترنت
          </h3>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">{query}</p>

        {loading && (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> جاري البحث عن أحدث المعلومات...
          </p>
        )}
        {error && <p className="mt-6 text-sm font-semibold text-destructive">{error}</p>}
        {result && (
          <>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {result}
            </p>
            <button
              onClick={() => {
                saveDiagnosis({ question: query, answer: result, source: "بحث الإنترنت" });
                toast.success("تم الحفظ في سجل التشخيصات");
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3 text-sm font-bold text-primary-foreground active:scale-[0.98]"
            >
              <Save className="h-4 w-4" /> حفظ في السجل
            </button>
          </>
        )}
      </div>
    </div>
  );
}