import { useCallback } from "react";
import type { ConditionDef, CustomFieldDef, FilterDef, StepCategoryState, WizardStepState } from "./types";
import { emptyStep, newCondition } from "./wizard-state";

declare const shopify: { resourcePicker: (opts: { type: string; multiple: boolean; selectionIds?: { id: string }[]; }) => Promise<{ selection: any[] } | null>; toast: { show: (msg: string, opts?: { isError?: boolean }) => void }; };

type Args = {
  currentIdx: number;
  currentStep: WizardStepState;
  steps: WizardStepState[];
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
  setCustomFields: React.Dispatch<React.SetStateAction<CustomFieldDef[]>>;
  setSlideDir: React.Dispatch<React.SetStateAction<"forward" | "backward" | null>>;
  setSlideKey: React.Dispatch<React.SetStateAction<number>>;
  setSteps: React.Dispatch<React.SetStateAction<WizardStepState[]>>;
};

export function useWizardStepHandlers({ currentIdx, currentStep, steps, setCurrentIdx, setCustomFields, setSlideDir, setSlideKey, setSteps }: Args) {
  const updateStep = useCallback((idx: number, field: keyof WizardStepState, value: any) => setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))), [setSteps]);
  const updateCurrent = useCallback((field: keyof WizardStepState, value: any) => updateStep(currentIdx, field, value), [currentIdx, updateStep]);
  const navigateTo = useCallback((newIdx: number) => { if (newIdx === currentIdx) return; setSlideDir(newIdx > currentIdx ? "forward" : "backward"); setSlideKey((k) => k + 1); setCurrentIdx(newIdx); }, [currentIdx, setCurrentIdx, setSlideDir, setSlideKey]);
  const handleAddStep = useCallback(() => { const newIdx = steps.length; setSteps((prev) => [...prev, emptyStep()]); setSlideDir("forward"); setSlideKey((k) => k + 1); setCurrentIdx(newIdx); }, [setCurrentIdx, setSlideDir, setSlideKey, setSteps, steps.length]);
  const handleRemoveStep = useCallback((idx: number) => { if (steps.length === 1) return; setSteps((prev) => prev.filter((_, i) => i !== idx)); setSlideDir("backward"); setSlideKey((k) => k + 1); setCurrentIdx((prev) => Math.min(prev, steps.length - 2)); }, [setCurrentIdx, setSlideDir, setSlideKey, setSteps, steps.length]);
  const addRule = useCallback(() => setSteps((prev) => { const step = prev[currentIdx]; if (!step) return prev; if (step.conditions.length >= 2) { shopify.toast.show("A step can have at most 2 conditions"); return prev; } return prev.map((s, i) => i === currentIdx ? { ...s, conditions: [...s.conditions, newCondition()] } : s); }), [currentIdx, setSteps]);
  const removeRule = useCallback((id: string) => setSteps((prev) => prev.map((s, i) => i === currentIdx ? { ...s, conditions: s.conditions.filter((c) => c.id !== id) } : s)), [currentIdx, setSteps]);
  const updateRule = useCallback((id: string, field: keyof ConditionDef, val: string) => setSteps((prev) => prev.map((s, i) => i === currentIdx ? { ...s, conditions: s.conditions.map((c) => c.id === id ? { ...c, [field]: val } : c) } : s)), [currentIdx, setSteps]);
  const pickProducts = useCallback(async () => { const result = await shopify.resourcePicker({ type: "product", multiple: true, selectionIds: currentStep.products.map((p) => ({ id: p.id })) }); if (result?.selection) updateCurrent("products", result.selection.map((p: any) => ({ id: p.id, title: p.title, imageUrl: p.images?.[0]?.originalSrc ?? p.images?.[0]?.url ?? null, variants: p.variants ?? [] }))); }, [currentStep.products, updateCurrent]);
  const pickCollections = useCallback(async () => { const result = await shopify.resourcePicker({ type: "collection", multiple: true, selectionIds: currentStep.collections.map((c: any) => ({ id: c.id })) }); if (result?.selection) updateCurrent("collections", result.selection); }, [currentStep.collections, updateCurrent]);
  const updateStepCategory = useCallback((catId: string, field: keyof StepCategoryState, value: any) => setSteps((prev) => prev.map((s, i) => i === currentIdx ? { ...s, StepCategory: s.StepCategory.map((c) => c.id === catId ? { ...c, [field]: value } : c) } : s)), [currentIdx, setSteps]);
  const addCategory = useCallback(() => setSteps((prev) => prev.map((s, i) => i === currentIdx ? { ...s, StepCategory: [...s.StepCategory, { id: `cat-${Date.now()}`, name: `Category ${s.StepCategory.length + 1}`, sortOrder: s.StepCategory.length, products: [], collections: [] }] } : s)), [currentIdx, setSteps]);
  const deleteCategory = useCallback((catId: string) => setSteps((prev) => prev.map((s, i) => i === currentIdx ? { ...s, StepCategory: s.StepCategory.filter((c) => c.id !== catId).map((c, idx) => ({ ...c, sortOrder: idx })) } : s)), [currentIdx, setSteps]);
  const pickCategoryProducts = useCallback(async (catId: string) => { const cat = steps[currentIdx]?.StepCategory.find((c) => c.id === catId); const result = await shopify.resourcePicker({ type: "product", multiple: true, selectionIds: (cat?.products ?? []).map((p: any) => ({ id: p.id })) }); if (result?.selection) updateStepCategory(catId, "products", result.selection.map((p: any) => ({ id: p.id, title: p.title, imageUrl: p.images?.[0]?.originalSrc ?? p.images?.[0]?.url ?? null }))); }, [currentIdx, steps, updateStepCategory]);
  const pickCategoryCollections = useCallback(async (catId: string) => { const cat = steps[currentIdx]?.StepCategory.find((c) => c.id === catId); const result = await shopify.resourcePicker({ type: "collection", multiple: true, selectionIds: (cat?.collections ?? []).map((c: any) => ({ id: c.id })) }); if (result?.selection) updateStepCategory(catId, "collections", result.selection.map((c: any) => ({ id: c.id, handle: c.handle, title: c.title }))); }, [currentIdx, steps, updateStepCategory]);
  const addFilter = useCallback((stepIdx: number) => setSteps((prev) => prev.map((s, i) => i === stepIdx && s.collections.length > 0 ? { ...s, filters: [...s.filters, { id: crypto.randomUUID(), label: "", collectionHandle: s.collections[0]?.handle || s.collections[0]?.id || "" }] } : s)), [setSteps]);
  const removeFilter = useCallback((stepIdx: number, filterId: string) => setSteps((prev) => prev.map((s, i) => i === stepIdx ? { ...s, filters: s.filters.filter((f) => f.id !== filterId) } : s)), [setSteps]);
  const updateFilter = useCallback((stepIdx: number, filterId: string, updates: Partial<FilterDef>) => setSteps((prev) => prev.map((s, i) => i === stepIdx ? { ...s, filters: s.filters.map((f) => f.id === filterId ? { ...f, ...updates } : f) } : s)), [setSteps]);
  const addCustomField = useCallback(() => setCustomFields((prev) => [...prev, { id: crypto.randomUUID(), dbId: null, label: "", fieldType: "text" as const, required: false, options: [] }]), [setCustomFields]);
  const removeCustomField = useCallback((id: string) => setCustomFields((prev) => prev.filter((cf) => cf.id !== id)), [setCustomFields]);
  const updateCustomField = useCallback((id: string, updates: Partial<CustomFieldDef>) => setCustomFields((prev) => prev.map((cf) => (cf.id === id ? { ...cf, ...updates } : cf))), [setCustomFields]);
  return { updateCurrent, navigateTo, handleAddStep, handleRemoveStep, addRule, removeRule, updateRule, pickProducts, pickCollections, updateStepCategory, addCategory, deleteCategory, pickCategoryProducts, pickCategoryCollections, addFilter, removeFilter, updateFilter, addCustomField, removeCustomField, updateCustomField };
}
