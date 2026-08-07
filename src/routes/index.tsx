import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, WifiOff, Tractor, ArrowRight } from "lucide-react";
import { SettingsSheet, currencyLabel, type Currency, type Farm } from "@/components/SettingsSheet";
import { AiAdvisor } from "@/components/AiAdvisor";
import { Medicines } from "@/components/Medicines";
import { Flocks } from "@/components/Flocks";
import { TraderLedger } from "@/components/TraderLedger";
import { Paywall, useSubscription } from "@/components/Subscription";
import { MyFarmsSheet } from "@/components/MyFarms";
import { WelcomeScreen, FarmsScreen } from "@/components/FarmsHome";
import { usePersistentState, useOnline } from "@/lib/persist";
import { registerOfflineSupport } from "@/lib/offline";
import { translator, type Lang } from "@/lib/i18n";
import { farmTypeOf, tabsFor, type FarmKind } from "@/lib/farm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriPulse | إدارة مزارع الدواجن" },
      {
        name: "description",
        content:
          "AgriPulse تطبيق عربي لإدارة مزارع الدواجن: كشف حساب تراكمي لكل تاجر، متابعة الأفواج بالأشهر والأسابيع، الأدوية، والمستشار الذكي — يعمل بدون إنترنت.",
      },
      { property: "og:title", content: "AgriPulse | إدارة مزارع الدواجن" },
      {
        property: "og:description",
        content: "أدر عدة مزارع دواجن بكشوفات حسابات تراكمية وأفواج وأدوية ومستشار ذكي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

const POULTRY: FarmKind = "poultry";

function App() {
  const [farms, setFarms, loadedFarms] = usePersistentState<Farm[]>("agripulse_farms", []);
  const [activeFarmId, setActiveFarmId, loadedActive] = usePersistentState<string>(
    "agripulse_active_farm",
    "",
  );
  const [welcomeSeen, setWelcomeSeen, loadedWelcome] = usePersistentState<boolean>(
    "agripulse_welcome_seen",
    false,
  );
  const [lang, setLang] = usePersistentState<Lang>("agripulse_lang", "ar");
  const [fontScale, setFontScale] = usePersistentState<number>("agripulse_font_scale", 1);
  const [myFarmsOpen, setMyFarmsOpen] = useState(false);

  useEffect(() => {
    registerOfflineSupport();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${Math.round(fontScale * 100)}%`;
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [fontScale]);

  // ترحيل المزارع القديمة إلى نوع الدواجن حصراً
  useEffect(() => {
    if (!loadedFarms) return;
    setFarms((prev) =>
      prev.some((f) => f.kind !== POULTRY)
        ? prev.map((f) => ({ ...f, kind: POULTRY, emoji: "🐓", label: "مزرعة دواجن" }))
        : prev,
    );
  }, [loadedFarms, setFarms]);

  if (!loadedFarms || !loadedActive || !loadedWelcome) return null;

  const active = farms.find((f) => f.id === activeFarmId) ?? null;

  const createFarm = (name: string) => {
    const type = farmTypeOf();
    const farm: Farm = {
      id: `farm-${Date.now()}`,
      name: name.trim() || "مزرعتي",
      emoji: type.emoji,
      label: type.label,
      kind: type.id,
    };
    setFarms((prev) => [...prev, farm]);
    setActiveFarmId(farm.id);
  };

  const renameFarm = (id: string, name: string) =>
    setFarms((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));

  const deleteFarm = (id: string) => {
    setFarms((prev) => prev.filter((f) => f.id !== id));
    if (id === activeFarmId) setActiveFarmId("");
  };

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-dvh bg-background font-display text-foreground"
    >
      <div className="mx-auto min-h-dvh w-full max-w-md">
        {!welcomeSeen ? (
          <WelcomeScreen onStart={() => setWelcomeSeen(true)} />
        ) : active ? (
          <Dashboard
            key={active.id}
            farm={active}
            farms={farms}
            onSelectFarm={setActiveFarmId}
            onAddFarm={createFarm}
            onDeleteFarm={deleteFarm}
            onMyFarms={() => setMyFarmsOpen(true)}
            accountName={active.name}
            onSignOut={() => setActiveFarmId("")}
            lang={lang}
            onLangChange={setLang}
            fontScale={fontScale}
            onFontScaleChange={setFontScale}
          />
        ) : (
          <FarmsScreen
            farms={farms}
            onOpen={setActiveFarmId}
            onCreate={createFarm}
            onRename={renameFarm}
            onDelete={deleteFarm}
          />
        )}

        <MyFarmsSheet
          open={myFarmsOpen}
          onClose={() => setMyFarmsOpen(false)}
          farms={farms}
          activeFarmId={active?.id ?? ""}
          onSelect={setActiveFarmId}
          onCreate={createFarm}
          onDelete={deleteFarm}
        />
      </div>
    </main>
  );
}

function Dashboard({
  farm,
  farms,
  onSelectFarm,
  onAddFarm,
  onDeleteFarm,
  onMyFarms,
  accountName,
  onSignOut,
  lang,
  onLangChange,
  fontScale,
  onFontScaleChange,
}: {
  farm: Farm;
  farms: Farm[];
  onSelectFarm: (id: string) => void;
  onAddFarm: (name: string) => void;
  onDeleteFarm: (id: string) => void;
  onMyFarms: () => void;
  accountName: string;
  onSignOut: () => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
  fontScale: number;
  onFontScaleChange: (v: number) => void;
}) {
  const t = translator(lang);
  const subscription = useSubscription();
  const online = useOnline();
  const [tab, setTab] = useState("ledger");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currency, setCurrency] = usePersistentState<Currency>("agripulse_currency", "syp");
  const [dark, setDark] = usePersistentState<boolean>("agripulse_dark", false);
  const [notifications, setNotifications] = usePersistentState("agripulse_notifications", {
    meds: true,
    ledger: true,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  const tabs = tabsFor();
  const symbol = currencyLabel[currency];

  const exportData = () => {
    const dump: Record<string, unknown> = {};
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith("agripulse")) continue;
      dump[key] = window.localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agripulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    const ok = window.confirm(
      lang === "ar"
        ? "سيتم حذف كل المزارع والحسابات المحفوظة على هذا الجهاز. متابعة؟"
        : "This deletes every farm and ledger stored on this device. Continue?",
    );
    if (!ok) return;
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("agripulse")) keys.push(key);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
    window.location.reload();
  };

  const requestDeleteFarm = () => {
    const ok = window.confirm(`سيتم حذف مزرعة «${farm.name}» من هذا الجهاز. متابعة؟`);
    if (!ok) return;
    setSettingsOpen(false);
    onDeleteFarm(farm.id);
  };

  return (
    <section className="min-h-dvh pb-28">
      <header className="rounded-b-[2rem] bg-forest px-6 pt-10 pb-8 shadow-luxe">
        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-95"
        >
          <ArrowRight className="h-4 w-4" /> رجوع إلى مزارعي
        </button>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-xs tracking-widest text-primary-foreground/60">
              {accountName || t("myFarmLabel")}
            </p>
            <h1 className="truncate text-2xl font-bold text-primary-foreground">{farm.name}</h1>
            <p className="mt-1 text-xs text-gold">🐓 مزرعة دواجن</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={onMyFarms}
              aria-label="مزارعي"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-foreground/10 text-primary-foreground active:scale-95"
            >
              <Tractor className="h-5 w-5" strokeWidth={1.9} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label={t("menu")}
              className="grid h-11 w-11 place-items-center rounded-2xl bg-goldish text-accent-foreground shadow-goldish active:scale-95"
            >
              <Menu className="h-5 w-5" strokeWidth={2.1} />
            </button>
          </div>
        </div>

        {farms.length > 1 && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {farms.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelectFarm(f.id)}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  f.id === farm.id
                    ? "bg-goldish text-accent-foreground shadow-goldish"
                    : "bg-primary-foreground/10 text-primary-foreground/80"
                }`}
              >
                🐓 {f.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="animate-rise px-6 pt-6" key={tab}>
        {!online && (
          <p className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
            <WifiOff className="h-4 w-4 shrink-0" />
            {t("offlineBanner")}
          </p>
        )}

        {tab === "ledger" && <TraderLedger farmId={farm.id} currencySymbol={symbol} farmName={farm.name} />}

        {tab === "flocks" && <Flocks farmId={farm.id} />}

        {tab === "meds" &&
          (subscription.active ? (
            <Medicines farmKind={POULTRY} />
          ) : (
            <Paywall onActivate={subscription.activate} />
          ))}

        {tab === "ai" &&
          (subscription.active ? (
            <AiAdvisor farmKind={POULTRY} lang={lang} />
          ) : (
            <Paywall onActivate={subscription.activate} />
          ))}
      </div>

      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/95 px-3 py-2 backdrop-blur">
        <ul className="grid grid-cols-4">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setTab(item.id)}
                  className={`flex w-full flex-col items-center gap-1 rounded-xl py-2 transition-all duration-300 ${
                    active ? "bg-secondary" : ""
                  }`}
                >
                  <span className={`text-lg transition-transform ${active ? "scale-110" : ""}`}>
                    {item.emoji}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        farms={farms}
        activeFarmId={farm.id}
        onSelectFarm={onSelectFarm}
        onAddFarm={onAddFarm}
        accountName={accountName}
        onSignOut={() => {
          setSettingsOpen(false);
          onSignOut();
        }}
        onDeleteFarm={requestDeleteFarm}
        currency={currency}
        onCurrencyChange={setCurrency}
        dark={dark}
        onDarkChange={setDark}
        notifications={notifications}
        onNotificationsChange={setNotifications}
        lang={lang}
        onLangChange={onLangChange}
        fontScale={fontScale}
        onFontScaleChange={onFontScaleChange}
        onExportData={exportData}
        onClearData={clearData}
      />
    </section>
  );
}
