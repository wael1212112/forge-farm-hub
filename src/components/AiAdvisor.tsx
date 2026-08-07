import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Bot, WifiOff, Mic, MicOff } from "lucide-react";
import { saveDiagnosis } from "./DiagnosisArchive";
import { useOnline } from "@/lib/persist";
import { useSpeechInput } from "@/lib/speech";
import { advisorSuggestions, type FarmKind } from "@/lib/farm";


type Msg = { role: "user" | "assistant"; content: string };

// عرض مبسط لتنسيق الماركداون (**نص عريض**)
function renderRich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-bold text-primary">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part.replace(/^#{1,6}\s*/gm, "")}</span>
    ),
  );
}

export function AiAdvisor({
  farmKind = "mixed",
  lang = "ar",
}: {
  farmKind?: FarmKind;
  lang?: "ar" | "en";
}) {
  const online = useOnline();
  const suggestions = advisorSuggestions(farmKind);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeechInput(lang === "ar" ? "ar-SA" : "en-US", (text) => setInput(text));


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    if (!online) {
      setError("المستشار الذكي يحتاج اتصالاً بالإنترنت — أما دليل الأدوية والأطباء وسجل التشخيصات فيعملان بدون إنترنت.");
      return;
    }
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error || "تعذّر الاتصال بالمستشار.");
      setMessages([...next, { role: "assistant", content: data.reply }]);
      saveDiagnosis({ question: content, answer: data.reply, source: "المستشار الذكي" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex h-[calc(100vh-16rem)] min-h-[24rem] flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 rounded-t-2xl bg-forest px-5 py-4">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-goldish">
          <Bot className="h-5 w-5 text-accent-foreground" strokeWidth={1.9} />
        </span>
        <div>
          <p className="text-sm font-bold text-primary-foreground">المستشار الذكي</p>
          <p className="text-[11px] text-gold">
            {online ? "متاح الآن للإجابة على أسئلتك" : "غير متاح — يحتاج اتصالاً بالإنترنت"}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {!online && (
          <p className="mb-2 flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
            <WifiOff className="h-4 w-4 shrink-0" />
            لا يوجد اتصال بالإنترنت — استشارات المستشار الذكي والبحث المباشر تحتاج اتصالاً. الميزات
            المجانية (الأدوية، الأطباء، السجلات، سجل التشخيصات) تعمل بدون إنترنت.
          </p>
        )}
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              اسأل عن التغذية، الأمراض، أو تحسين الإنتاج وسيقدم لك المستشار توصيات مخصصة لمزرعتك.
            </p>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="w-full rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-right text-sm text-primary transition-transform active:scale-[0.98]"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-start" : "flex justify-end"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-forest px-4 py-3 text-sm leading-relaxed text-primary-foreground"
                  : "max-w-[92%] whitespace-pre-wrap rounded-2xl bg-secondary/70 px-4 py-3 text-sm leading-relaxed text-foreground"
              }
            >
              {m.role === "assistant" ? renderRich(m.content) : m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            المستشار يكتب...
          </div>
        )}
        {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <textarea
          ref={inputRef}
          value={input}
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={
            speech.listening
              ? lang === "ar"
                ? "جارٍ الاستماع... تحدّث الآن"
                : "Listening... speak now"
              : lang === "ar"
                ? "اكتب سؤالك هنا أو استخدم الميكروفون..."
                : "Type your question or use the mic..."
          }
          className="max-h-32 min-h-[3rem] flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
        />
        <button
          type="button"
          onClick={() => {
            if (!speech.supported) {
              setError(
                lang === "ar"
                  ? "متصفحك لا يدعم الإدخال الصوتي — استخدم الكتابة."
                  : "Your browser doesn't support voice input — please type instead.",
              );
              return;
            }
            setError(null);
            speech.toggle();
          }}
          aria-label={speech.listening ? "إيقاف الاستماع" : "التحدث بالصوت"}
          aria-pressed={speech.listening}
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border transition-transform active:scale-95 ${
            speech.listening
              ? "animate-glow border-destructive bg-destructive text-destructive-foreground"
              : "border-border bg-secondary text-primary"
          }`}
        >
          {speech.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <button
          type="submit"
          disabled={loading || !online || input.trim().length === 0}
          aria-label="إرسال"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-goldish text-accent-foreground shadow-goldish transition-transform active:scale-95 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </form>

    </div>
  );
}
