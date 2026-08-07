/**
 * تسجيل خدمة العمل بدون إنترنت (Service Worker) — يعمل فقط في التطبيق المنشور.
 */
const SW_URL = "/sw.js";

function blocked() {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  if (window.top !== window.self) return true;

  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).has("sw") ) {
    return new URLSearchParams(window.location.search).get("sw") === "off";
  }
  return false;
}

async function unregisterApp() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export function registerOfflineSupport() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (blocked()) {
    void unregisterApp();
    return;
  }
  void navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
    /* تجاهل فشل التسجيل */
  });
}
