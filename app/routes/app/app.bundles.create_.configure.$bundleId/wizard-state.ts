import type { ConditionDef, FilterDef, StepCategoryState, WizardStepState } from "./types";

export function newCondition(): ConditionDef {
  return { id: crypto.randomUUID(), conditionType: "quantity", conditionOperator: "greater_than_or_equal_to", conditionValue: "1" };
}

export function emptyStep(): WizardStepState {
  return {
    tempId: crypto.randomUUID(),
    dbId: null,
    name: "",
    pageTitle: "",
    iconUrl: null,
    products: [],
    collections: [],
    StepCategory: [{ id: `cat-${Date.now()}`, name: "Category 1", sortOrder: 0, products: [], collections: [] }],
    conditions: [],
    filters: [],
    preSelectAll: false,
    activeTab: "products",
  };
}

function buildConditions(s: any): ConditionDef[] {
  const out: ConditionDef[] = [];
  if (s.conditionType) out.push({ id: crypto.randomUUID(), conditionType: s.conditionType, conditionOperator: s.conditionOperator ?? "greater_than_or_equal_to", conditionValue: String(s.conditionValue ?? 1) });
  if (s.conditionOperator2) out.push({ id: crypto.randomUUID(), conditionType: s.conditionType ?? "quantity", conditionOperator: s.conditionOperator2, conditionValue: String(s.conditionValue2 ?? 1) });
  return out;
}

export function initSteps(dbSteps: any[]): WizardStepState[] {
  if (!dbSteps || dbSteps.length === 0) return [emptyStep()];
  return dbSteps.map((s) => {
    const dbCats: StepCategoryState[] = Array.isArray(s.StepCategory) && s.StepCategory.length > 0
      ? s.StepCategory.map((cat: any) => ({ id: cat.id, name: cat.name || "", sortOrder: cat.sortOrder ?? 0, products: Array.isArray(cat.products) ? cat.products : [], collections: Array.isArray(cat.collections) ? cat.collections : [] }))
      : [{ id: `cat-${Date.now()}`, name: "Category 1", sortOrder: 0, products: [], collections: [] }];
    return {
      tempId: crypto.randomUUID(),
      dbId: s.id,
      name: s.name ?? "",
      pageTitle: s.pageTitle ?? "",
      iconUrl: s.timelineIconUrl ?? null,
      products: Array.isArray(s.StepProduct) ? s.StepProduct.map((sp: any) => ({ id: sp.productId, title: sp.title, imageUrl: sp.imageUrl, variants: sp.variants ?? [] })) : [],
      collections: Array.isArray(s.collections) ? (s.collections as any[]) : [],
      StepCategory: dbCats,
      conditions: buildConditions(s),
      filters: Array.isArray(s.filters) ? (s.filters as FilterDef[]) : [],
      preSelectAll: false,
      activeTab: "products" as const,
    };
  });
}
