import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM = `أنت "المستشار الذكي" في تطبيق AgriPulse لإدارة المزارع.
أجب دائماً باللغة العربية الفصحى المبسطة وبأسلوب عملي ومختصر.
تخصصك: الدواجن، المواشي والأغنام، المحاصيل والري، التغذية، الأمراض وأعراضها،
الأدوية البيطرية الوطنية والأجنبية، وإدارة تكاليف المزرعة.
اذكر خطوات عملية ونقاط مرقمة عند الحاجة، ونبّه لاستشارة طبيب بيطري في الحالات الخطرة.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: Msg[] };
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) {
          return new Response(JSON.stringify({ error: "لا توجد رسائل" }), { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response(JSON.stringify({ error: "المفتاح غير مهيأ" }), { status: 500 });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            messages: [{ role: "system", content: SYSTEM }, ...messages.slice(-16)],
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error(`AI gateway error [${res.status}]: ${text}`);
          const msg =
            res.status === 429
              ? "الطلبات كثيرة الآن، حاول بعد قليل."
              : res.status === 402
                ? "انتهى رصيد الذكاء الاصطناعي، يرجى إضافة رصيد."
                : "تعذّر الحصول على رد من المستشار.";
          return new Response(JSON.stringify({ error: msg }), { status: res.status });
        }

        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const reply = data.choices?.[0]?.message?.content ?? "لم أتمكن من صياغة رد.";
        return new Response(JSON.stringify({ reply }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
