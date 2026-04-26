export interface AddonStepLockInput {
  isFreeGift: boolean;
  addonUnlockAfterCompletion: boolean;
  minQuantity?: number;
  selectedQuantity: number;
}

export function isAddonStepLocked(
  step: AddonStepLockInput,
  stepIndex: number,
  allSteps: AddonStepLockInput[],
): boolean {
  if (!step.isFreeGift || !step.addonUnlockAfterCompletion) return false;
  for (let i = 0; i < stepIndex; i++) {
    const prior = allSteps[i];
    if (prior.selectedQuantity < (prior.minQuantity ?? 1)) return true;
  }
  return false;
}
