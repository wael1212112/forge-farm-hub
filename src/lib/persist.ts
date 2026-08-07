import { useEffect, useState } from "react";

/**
 * حالة محفوظة في متصفح المستخدم (LocalStorage) — تُقرأ بعد الترطيب لتجنّب اختلاف SSR.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let next = initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) next = JSON.parse(raw) as T;
    } catch {
      /* تجاهل القيم التالفة */
    }
    setValue(next);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* التخزين ممتلئ أو محجوب */
    }
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}

export function clearStored(keys: string[]) {
  if (typeof window === "undefined") return;
  for (const k of keys) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* تجاهل */
    }
  }
}

/** هل يوجد اتصال بالإنترنت الآن؟ */
export function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(window.navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}
