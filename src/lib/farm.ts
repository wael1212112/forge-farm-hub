export type FarmKind = "poultry" | "livestock" | "crops" | "mixed";

export type FarmType = {
  id: FarmKind;
  emoji: string;
  label: string;
};

/** التطبيق مخصص حصراً لمزارع الدواجن */
export const farmTypes: FarmType[] = [{ id: "poultry", emoji: "🐓", label: "مزرعة دواجن" }];

export const farmTypeOf = (_kind?: FarmKind) => farmTypes[0]!;

/** التبويبات السفلية الأربعة الثابتة */
export function tabsFor(_kind?: FarmKind) {
  return [
    { id: "ledger", emoji: "📊", label: "كشف حساب" },
    { id: "flocks", emoji: "🐣", label: "الأفواج" },
    { id: "meds", emoji: "💊", label: "الأدوية" },
    { id: "ai", emoji: "🤖", label: "المستشار" },
  ];
}


/** أسئلة مقترحة للمستشار الذكي حسب نوع المزرعة */
export function advisorSuggestions(kind: FarmKind) {
  if (kind === "poultry")
    return [
      "ما سبب انخفاض إنتاج البيض فجأة؟",
      "برنامج تحصين كتاكيت اللاحم من عمر يوم",
      "كيف أعالج ارتفاع نسبة النفوق في العنبر؟",
    ];
  if (kind === "livestock")
    return [
      "جدول تحصين مناسب لقطيع أغنام",
      "علاج التهاب الضرع في الأبقار الحلوب",
      "أفضل خلطة علفية لتسمين الخراف",
    ];
  if (kind === "crops")
    return [
      "أفضل موعد ري للقمح في الصيف",
      "برنامج تسميد للطماطم في البيت البلاستيكي",
      "كيف أكافح الذبابة البيضاء بطريقة آمنة؟",
    ];
  return [
    "ما سبب انخفاض إنتاج البيض فجأة؟",
    "جدول تحصين مناسب لقطيع أغنام",
    "أفضل موعد ري للقمح في الصيف",
  ];
}

/** فئات دفتر الحسابات حسب نوع المزرعة */
export type LedgerCat = { id: string; emoji: string; label: string };

export function ledgerCategoriesFor(kind: FarmKind): LedgerCat[] {
  if (kind === "poultry")
    return [
      { id: "eggs", emoji: "🥚", label: "تجار البيض والمنتجات" },
      { id: "feed", emoji: "🌾", label: "تجار الأعلاف والمواد" },
      { id: "vet", emoji: "🩺", label: "الأطباء والصيدليات البيطرية" },
      { id: "workers", emoji: "👷", label: "عمال العنابر" },
    ];
  if (kind === "livestock")
    return [
      { id: "milk", emoji: "🥛", label: "تجار الحليب واللحوم" },
      { id: "feed", emoji: "🌾", label: "تجار الأعلاف والمواد" },
      { id: "vet", emoji: "🩺", label: "الأطباء والصيدليات البيطرية" },
      { id: "herders", emoji: "🐕", label: "الرعاة والعمال" },
    ];
  if (kind === "crops")
    return [
      { id: "crops", emoji: "🌾", label: "تجار المحاصيل والحبوب" },
      { id: "inputs", emoji: "🧪", label: "تجار الأسمدة والبذار" },
      { id: "agro", emoji: "👨‍🌾", label: "مهندسون زراعيون ومبيدات" },
      { id: "machines", emoji: "🚜", label: "عمال وآليات وحصاد" },
    ];
  return [
    { id: "sales", emoji: "💰", label: "تجار المنتجات والمبيعات" },
    { id: "feed", emoji: "🌾", label: "تجار الأعلاف والمواد" },
    { id: "vet", emoji: "🩺", label: "الأطباء والمهندسون" },
    { id: "workers", emoji: "🚜", label: "عمال ومستلزمات المزرعة" },
  ];
}

/** تصفية الأطباء/المهندسين حسب نوع المزرعة */
export function vetMatchesKind(specialty: string, kind: FarmKind) {
  if (kind === "mixed") return true;
  if (kind === "poultry") return /دواجن|طيور|تحصين/.test(specialty);
  if (kind === "livestock") return /أغنام|ماعز|أبقار|توليد|مواشي|ضرع|حيوانات/.test(specialty);
  return /زراع|محاصيل|نبات|مبيدات|ري|تربة/.test(specialty);
}
