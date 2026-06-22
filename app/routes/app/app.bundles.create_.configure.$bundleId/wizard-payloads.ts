import type { CustomFieldDef, WizardStepLike } from "./types";

export function buildCreateWizardConfigPayload(input: { steps: WizardStepLike[]; bundleStatus: string; searchBarEnabled: boolean; textOverridesByLocale: Record<string, Record<string, string>>; }) {
  return JSON.stringify({
    steps: input.steps.map((step) => ({ tempId: step.tempId, dbId: step.dbId ?? null, name: step.name ?? "", pageTitle: step.pageTitle ?? "", iconUrl: step.iconUrl ?? null, products: step.products ?? [], collections: step.collections ?? [], StepCategory: step.StepCategory ?? [], conditions: step.conditions ?? [], filters: step.filters ?? [] })),
    bundleStatus: input.bundleStatus,
    searchBarEnabled: input.searchBarEnabled,
    textOverridesByLocale: input.textOverridesByLocale ?? {},
  });
}

export function buildCreateWizardPricingPayload(input: { discountEnabled: boolean; discountType: string; discountRules: any[]; discountMessagingEnabled: boolean; showProgressBar: boolean; progressMessage: string; qualifiedMessage: string; }) {
  return JSON.stringify({ discountEnabled: input.discountEnabled, discountType: input.discountType, discountRules: input.discountRules, discountMessagingEnabled: input.discountMessagingEnabled, showProgressBar: input.showProgressBar, messages: { progress: input.progressMessage, qualified: input.qualifiedMessage, showInCart: input.discountMessagingEnabled } });
}

export function buildCreateWizardAssetsPayload(input: { promoBannerBgImage: string | null; loadingGif: string | null; searchBarEnabled: boolean; steps: WizardStepLike[]; customFields: CustomFieldDef[]; }) {
  return JSON.stringify({ promoBannerBgImage: input.promoBannerBgImage ?? "", loadingGif: input.loadingGif ?? "", searchBarEnabled: input.searchBarEnabled, stepsFilters: input.steps.filter((step) => step.dbId).map((step) => ({ stepDbId: step.dbId, filters: step.filters ?? [] })), customFields: input.customFields });
}

export function shouldSubmitCreateWizardPage(input: { baseline: string | null; current: string; requirePersistedStepIds?: boolean; steps?: Array<{ dbId?: string | null }>; }) {
  if (input.baseline !== input.current) return true;
  if (input.requirePersistedStepIds) return (input.steps ?? []).some((step) => !step.dbId);
  return false;
}
