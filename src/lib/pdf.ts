/** تصدير كشف حساب PDF ومشاركته — يعمل بالكامل في المتصفح وبدون إنترنت. */

export type PdfRow = {
  date: string;
  details: string;
  credit: string;
  debit: string;
  balance: string;
};

export type StatementPdf = {
  traderName: string;
  role: string;
  phone: string;
  farmName: string;
  rangeLabel: string;
  rows: PdfRow[];
  finalLabel: string;
  fileName: string;
};

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function buildHtml(d: StatementPdf) {
  const rows =
    d.rows.length === 0
      ? `<tr><td colspan="5" style="padding:18px;text-align:center;color:#7c7c7c">لا توجد حركات</td></tr>`
      : d.rows
          .map(
            (r, i) => `<tr style="background:${i % 2 ? "#f7f4ec" : "#ffffff"}">
              <td style="padding:10px 12px;color:#5d5d5d;white-space:nowrap">${esc(r.date)}</td>
              <td style="padding:10px 12px;color:#1d2b21;font-weight:600">${esc(r.details)}</td>
              <td style="padding:10px 12px;color:#14532d;font-weight:700">${esc(r.credit)}</td>
              <td style="padding:10px 12px;color:#9b1c1c;font-weight:700">${esc(r.debit)}</td>
              <td style="padding:10px 12px;color:#1d2b21;font-weight:700;white-space:nowrap">${esc(r.balance)}</td>
            </tr>`,
          )
          .join("");

  return `<div dir="rtl" style="width:820px;box-sizing:border-box;padding:36px;background:#ffffff;
      font-family:'Tajawal','Cairo','Segoe UI',system-ui,sans-serif;color:#1d2b21">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;
        background:linear-gradient(135deg,#14532d,#1d5f38);border-radius:20px;padding:20px 24px;color:#fdfbf5">
      <div>
        <div style="font-size:15px;opacity:.75">كشف حساب</div>
        <div style="font-size:26px;font-weight:800;margin-top:4px">${esc(d.traderName)}</div>
        <div style="font-size:13px;opacity:.8;margin-top:6px">${esc(d.role)}${
          d.phone ? " • " + esc(d.phone) : ""
        }</div>
      </div>
      <div style="text-align:left">
        <div style="font-size:30px;font-weight:800;color:#e3b23c">AgriPulse</div>
        <div style="font-size:13px;opacity:.8;margin-top:4px">${esc(d.farmName)}</div>
      </div>
    </div>

    <div style="margin-top:16px;font-size:14px;color:#4a4a4a;font-weight:600">${esc(d.rangeLabel)}</div>

    <table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:14px;
        border:1px solid #e6e0d2;border-radius:14px;overflow:hidden">
      <thead>
        <tr style="background:#e3b23c;color:#26210f;text-align:right">
          <th style="padding:12px">التاريخ</th>
          <th style="padding:12px">التفاصيل</th>
          <th style="padding:12px">له</th>
          <th style="padding:12px">عليه</th>
          <th style="padding:12px">الرصيد التراكمي</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="margin-top:18px;background:#14532d;color:#fdfbf5;border-radius:16px;padding:18px 24px;
        display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:15px;opacity:.8">الرصيد النهائي</span>
      <span style="font-size:24px;font-weight:800;color:#e3b23c">${esc(d.finalLabel)}</span>
    </div>

    <div style="margin-top:14px;text-align:center;font-size:12px;color:#8a8a8a">
      تم إنشاء هذا الكشف بواسطة تطبيق AgriPulse لإدارة مزارع الدواجن
    </div>
  </div>`;
}

/** ترسم HTML الكشف داخل لوحة رسم عبر SVG foreignObject (معزول تماماً عن ستايل التطبيق). */
async function renderCanvas(d: StatementPdf) {
  const W = 820;

  // قياس الطول الحقيقي داخل إطار معزول
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${W}px;height:200px;border:0;`;
  document.body.appendChild(frame);
  let height = 1000;
  let markup = buildHtml(d);
  try {
    const doc = frame.contentDocument!;
    doc.open();
    doc.write(
      `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0}body{margin:0;background:#fff}</style></head><body>${markup}</body></html>`,
    );
    doc.close();
    const el = doc.body.firstElementChild as HTMLElement | null;
    if (el) {
      height = Math.ceil(el.getBoundingClientRect().height) + 8;
      markup = new XMLSerializer().serializeToString(el);
    }
  } finally {
    frame.remove();
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}">` +
    `<foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`;

  const img = new Image();
  const loaded = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("svg-render-failed"));
  });
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await loaded;
  if (typeof img.decode === "function") await img.decode().catch(() => undefined);


  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function renderBlob(d: StatementPdf): Promise<Blob> {
  const [{ jsPDF }, canvas] = await Promise.all([import("jspdf"), renderCanvas(d)]);

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const imgW = pw - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;

  if (imgH <= ph - margin * 2) {
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", margin, margin, imgW, imgH);
  } else {
    // تقسيم الكشف الطويل على عدة صفحات
    const pageSlice = ((ph - margin * 2) * canvas.width) / imgW;
    let offset = 0;
    let first = true;
    while (offset < canvas.height) {
      const sliceH = Math.min(pageSlice, canvas.height - offset);
      const part = document.createElement("canvas");
      part.width = canvas.width;
      part.height = sliceH;
      part
        .getContext("2d")!
        .drawImage(canvas, 0, offset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      if (!first) pdf.addPage();
      pdf.addImage(
        part.toDataURL("image/jpeg", 0.95),
        "JPEG",
        margin,
        margin,
        imgW,
        (sliceH * imgW) / canvas.width,
      );
      first = false;
      offset += sliceH;
    }
  }

  return pdf.output("blob");
}


/** تنزيل الكشف كملف PDF. */
export async function downloadStatementPdf(d: StatementPdf) {
  const blob = await renderBlob(d);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${d.fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** مشاركة الكشف (واتساب/تطبيقات الهاتف) مع تنزيل احتياطي على الحاسوب. */
export async function shareStatementPdf(d: StatementPdf) {
  const blob = await renderBlob(d);
  const file = new File([blob], `${d.fileName}.pdf`, { type: "application/pdf" });
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
  };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: `كشف حساب: ${d.traderName}`,
        text: `كشف حساب ${d.traderName} — ${d.finalLabel}`,
      });
      return "shared" as const;
    } catch {
      return "cancelled" as const;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${d.fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded" as const;
}
