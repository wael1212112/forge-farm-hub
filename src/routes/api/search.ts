import { createFileRoute } from "@tanstack/react-router";

const SYSTEM = `أنت باحث متخصص في القطاع الزراعي والبيطري في سوريا.
مهمتك: البحث عن معلومات محدّثة حول الأدوية البيطرية والزراعية، الشركات الوطنية،
الأطباء البيطريين والعيادات، والأسعار التقديرية في السوق السوري.
أجب بالعربية الفصحى المبسطة وبنقاط مرقمة قصيرة، واذكر:
الاسم العلمي، دواعي الاستعمال، الجرعة، السعر التقديري إن توفر، وبديل وطني متاح.
إذا لم تكن المعلومة مؤكدة فاذكر ذلك بصراحة ونبّه لاستشارة طبيب بيطري.`;

async function callGateway(key: string, query: string, withSearch: boolean) {
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: query },
      ],
      ...(withSearch ? { tools: [{ type: "google_search" }] } : {}),
    }),
  });
}

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { query?: string };
        const query = (body.query ?? "").trim();
        if (!query) {
          return new Response(JSON.stringify({ error: "لا يوجد نص للبحث" }), { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response(JSON.stringify({ error: "خدمة البحث غير مهيأة" }), { status: 500 });
        }

        let res = await callGateway(key, query, true);
        if (!res.ok && res.status !== 429 && res.status !== 402) {
          res = await callGateway(key, query, false);
        }

        if (!res.ok) {
          const text = await res.text();
          console.error(`search gateway error [${res.status}]: ${text}`);
          const msg =
            res.status === 429
              ? "الطلبات كثيرة الآن، حاول بعد قليل."
              : res.status === 402
                ? "انتهى رصيد الذكاء الاصطناعي، يرجى إضافة رصيد."
                : "تعذّر البحث عبر الإنترنت الآن.";
          return new Response(JSON.stringify({ error: msg }), { status: res.status });
        }

        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const result = data.choices?.[0]?.message?.content ?? "لم أجد نتائج واضحة.";
        return new Response(JSON.stringify({ result }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});