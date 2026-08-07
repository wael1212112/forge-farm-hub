import { useCallback, useEffect, useState } from "react";
import { Archive, Trash2 } from "lucide-react";

let FARM_ID = "";
const KEY_BASE = "agripulse_diagnoses";
const key = () => (FARM_ID ? `${KEY_BASE}_${FARM_ID}` : KEY_BASE);

/** تحديد المزرعة النشطة حتى يكون لكل مزرعة سجل تشخيصات مستقل */
export function setArchiveFarm(id: string) {
  FARM_ID = id;
}

export type DiagnosisEntry = {
  id: string;
  question: string;
  answer: string;
  source: "المستشار الذكي" | "بحث الإنترنت" | "ملاحظة";
  date: string;
};

function read(): DiagnosisEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key());
    return raw ? (JSON.parse(raw) as DiagnosisEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveDiagnosis(entry: Omit<DiagnosisEntry, "id" | "date">) {
  if (typeof window === "undefined") return;
  const next: DiagnosisEntry[] = [
    { ...entry, id: `d-${Date.now()}`, date: new Date().toLocaleString("ar-EG") },
    ...read(),
  ].slice(0, 100);
  window.localStorage.setItem(key(), JSON.stringify(next));
  window.dispatchEvent(new Event("agripulse-diagnoses"));
}

export function useDiagnoses() {
  const [items, setItems] = useState<DiagnosisEntry[]>([]);

  const refresh = useCallback(() => setItems(read()), []);

  useEffect(() => {
    refresh();
    window.addEventListener("agripulse-diagnoses", refresh);
    return () => window.removeEventListener("agripulse-diagnoses", refresh);
  }, [refresh]);

  const remove = (id: string) => {
    const next = read().filter((d) => d.id !== id);
    window.localStorage.setItem(key(), JSON.stringify(next));
    setItems(next);
  };

  const clear = () => {
    window.localStorage.removeItem(key());
    setItems([]);
  };

  return { items, remove, clear };
}

export function DiagnosisArchive({ farmId }: { farmId?: string }) {
  if (farmId !== undefined) setArchiveFarm(farmId);
  const { items, remove, clear } = useDiagnoses();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-primary">
          <Archive className="h-4 w-4" /> سجل التشخيصات المحفوظة
        </h2>
        {items.length > 0 && (
          <button onClick={clear} className="text-[11px] font-semibold text-destructive">
            تفريغ السجل
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          لا توجد تشخيصات محفوظة بعد — كل إجابة من المستشار الذكي أو بحث الإنترنت تُحفظ هنا
          للاطلاع عليها لاحقاً بدون إنترنت.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((d) => {
            const open = openId === d.id;
            return (
              <div key={d.id} className="rounded-2xl border border-border/70 bg-secondary/40 p-3">
                <button
                  onClick={() => setOpenId(open ? null : d.id)}
                  className="w-full text-right"
                >
                  <p className="truncate text-sm font-semibold text-primary">{d.question}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {d.source} · {d.date}
                  </p>
                </button>
                {open && (
                  <>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {d.answer}
                    </p>
                    <button
                      onClick={() => remove(d.id)}
                      className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> حذف
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}