import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, Eye, EyeOff, Plus, WifiOff, Tractor } from "lucide-react";
import { Ledger } from "@/components/Ledger";
import { SettingsSheet, currencyLabel, type Currency, type Farm } from "@/components/SettingsSheet";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import { AiAdvisor } from "@/components/AiAdvisor";
import { Medicines } from "@/components/Medicines";
import { Flocks } from "@/components/Flocks";
import { Paywall, useSubscription } from "@/components/Subscription";
import { DailyAlertBanner } from "@/components/DailyAlert";
import { MyFarmsSheet } from "@/components/MyFarms";
import { WeatherWidget } from "@/components/WeatherWidget";
import { PoultryCards, EggSalesPage, FeedLogPage } from "@/components/PoultryModules";
import { WelcomeScreen, FarmsScreen } from "@/components/FarmsHome";
import { usePersistentState, useOnline } from "@/lib/persist";
import { registerOfflineSupport } from "@/lib/offline";
import { useWeather } from "@/lib/weather";
import { translator, type Lang } from "@/lib/i18n";
import { farmTypeOf, tabsFor, type FarmKind } from "@/lib/farm";
import { weatherAlert } from "@/lib/tips";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriPulse | إدارة مزارع الدواجن" },
      {
        name: "description",
        content:
          "AgriPulse تطبيق عربي لإدارة مزارع الدواجن: كشف حساب، متابعة الأفواج، الأدوية، والمستشار الذكي — يعمل بدون إنترنت.",
      },
      { property: "og:title", content: "AgriPulse | إدارة مزارع الدواجن" },
      {
        property: "og:description",
        content: "أدر عدة مزارع دواجن بحسابات وأفواج وأدوية ومستشار ذكي بواجهة عربية.",
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
      className="min-h-screen bg-background font-display text-foreground"
    >
      <div className="mx-auto min-h-screen w-full max-w-md">
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
  const { weather, cached } = useWeather(online);
  const [tab, setTab] = useState("ledger");
  const [page, setPage] = useState<"home" | "eggs" | "feed">("home");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [currency, setCurrency] = usePersistentState<Currency>("agripulse_currency", "syp");
  const [dark, setDark] = usePersistentState<boolean>("agripulse_dark", false);
  const [notifications, setNotifications] = usePersistentState("agripulse_notifications", {
    meds: true,
    ledger: true,
  });
  const [hidden, setHidden] = useState(false);
  const [income, setIncome] = usePersistentState<number>(`agripulse_income_${farm.id}`, 0);
  const [expenses, setExpenses] = usePersistentState<number>(`agripulse_expenses_${farm.id}`, 0);
  const [activity, setActivity] = usePersistentState<
    { id: string; label: string; value: string }[]
  >(`agripulse_activity_${farm.id}`, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    setPage("home");
  }, [tab]);

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

  const handleQuickSave = (entry: { kind: "in" | "out" | "note"; amount: number; text: string }) => {
    if (entry.kind === "in") setIncome((v) => v + entry.amount);
    if (entry.kind === "out") setExpenses((v) => v + entry.amount);
    setActivity((prev) => [
      {
        id: `a-${Date.now()}`,
        label: entry.text || (entry.kind === "in" ? "إيراد" : "مصروف"),
        value:
          entry.kind === "note"
            ? "ملاحظة"
            : `${entry.kind === "in" ? "+" : "-"} ${entry.amount.toLocaleString("ar-EG")} ${symbol}`,
      },
      ...prev,
    ]);
  };

  const requestDeleteFarm = () => {
    const ok = window.confirm(`سيتم حذف مزرعة «${farm.name}» من هذا الجهاز. متابعة؟`);
    if (!ok) return;
    setSettingsOpen(false);
    onDeleteFarm(farm.id);
  };

  return (
    <section className="min-h-screen pb-28">
      <header className="rounded-b-[2rem] bg-forest px-6 pt-12 pb-8 shadow-luxe">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
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
              onClick={() => setHidden((v) => !v)}
              aria-label={hidden ? t("showNumbers") : t("hideNumbers")}
              className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-foreground/10 text-primary-foreground active:scale-95"
            >
              {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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

        {tab === "ledger" && page === "eggs" && (
          <EggSalesPage
            farmId={farm.id}
            currencySymbol={symbol}
            onBack={() => setPage("home")}
          />
        )}
        {tab === "ledger" && page === "feed" && (
          <FeedLogPage farmId={farm.id} currencySymbol={symbol} onBack={() => setPage("home")} />
        )}

        {tab === "ledger" && page === "home" && (
          <div className="space-y-4">
            <DailyAlertBanner kind={POULTRY} online={online} weather={weather} />

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title={t("income")}
                value={hidden ? "••••" : `${income.toLocaleString("ar-EG")} ${symbol}`}
                hint={t("thisMonth")}
              />
              <StatCard
                title={t("expenses")}
                value={hidden ? "••••" : `${expenses.toLocaleString("ar-EG")} ${symbol}`}
                hint={t("thisMonth")}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <WeatherWidget weather={weather} cached={cached} label={t("weatherToday")} />
              <div className="px-5 py-4">
                <p className="text-xs font-bold tracking-widest text-gold">{t("todayAlert")}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {weather
                    ? (weatherAlert(POULTRY, weather)?.body ?? "")
                    : "حافظ على التهوية وتوفر ماء نظيف بشكل دائم، وراقب أي أعراض غير طبيعية."}
                </p>
              </div>
            </div>

            <PoultryCards
              farmId={farm.id}
              currencySymbol={symbol}
              onOpenEggs={() => setPage("eggs")}
              onOpenFeed={() => setPage("feed")}
            />

            <Ledger farmId={farm.id} farmKind={POULTRY} currencySymbol={symbol} />

            <Panel title={t("todayActivity")}>
              {activity.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">{t("noActivity")}</p>
              ) : (
                activity.map((a) => <Row key={a.id} label={a.label} value={a.value} />)
              )}
            </Panel>
          </div>
        )}

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

      {tab === "ledger" && page === "home" && (
        <button
          onClick={() => setQuickOpen(true)}
          aria-label="إضافة سريعة"
          className="fixed bottom-24 left-5 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-goldish text-accent-foreground shadow-goldish active:scale-95 sm:left-[calc(50%-11rem)]"
        >
          <Plus className="h-7 w-7" strokeWidth={2.2} />
        </button>
      )}

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

      <QuickAddSheet
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        currencySymbol={symbol}
        onSave={handleQuickSave}
      />
    </section>
  );
}

function StatCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-2 text-xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-[11px] text-gold">{hint}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-bold text-primary">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <span className="min-w-0 truncate text-sm text-foreground">{label}</span>
      <span className="shrink-0 text-sm font-semibold text-primary">{value}</span>
    </div>
  );
}
