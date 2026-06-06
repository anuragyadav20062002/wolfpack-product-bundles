/**
 * Unit Tests: isAddonStepLocked
 *
 * Pure function — no mocks needed.
 * Determines whether an add-on step tab should be locked based on
 * prior steps' selected quantities vs their minQuantity.
 */

import { isAddonStepLocked } from "../../../app/lib/addon-step-lock";

type StepState = {
  id: string;
  isFreeGift: boolean;
  addonUnlockAfterCompletion: boolean;
  minQuantity: number;
  selectedQuantity: number;
};

function makeStep(overrides: Partial<StepState> = {}): StepState {
  return {
    id: "step-1",
    isFreeGift: false,
    addonUnlockAfterCompletion: true,
    minQuantity: 1,
    selectedQuantity: 0,
    ...overrides,
  };
}

describe("isAddonStepLocked", () => {
  it("returns false for a regular (non-addon) step regardless of prior step state", () => {
    const step = makeStep({ isFreeGift: false, addonUnlockAfterCompletion: true });
    const allSteps = [makeStep({ selectedQuantity: 0 }), step];

    expect(isAddonStepLocked(step, 1, allSteps)).toBe(false);
  });

  it("returns false when addonUnlockAfterCompletion is false", () => {
    const priorStep = makeStep({ selectedQuantity: 0, minQuantity: 2 });
    const addonStep = makeStep({ isFreeGift: true, addonUnlockAfterCompletion: false });
    const allSteps = [priorStep, addonStep];

    expect(isAddonStepLocked(addonStep, 1, allSteps)).toBe(false);
  });

  it("returns false when it is the first step (no prior steps to check)", () => {
    const addonStep = makeStep({ isFreeGift: true, addonUnlockAfterCompletion: true, selectedQuantity: 0 });
    const allSteps = [addonStep];

    expect(isAddonStepLocked(addonStep, 0, allSteps)).toBe(false);
  });

  it("returns false when all prior steps meet their minQuantity", () => {
    const step1 = makeStep({ id: "step-1", selectedQuantity: 2, minQuantity: 2 });
    const step2 = makeStep({ id: "step-2", selectedQuantity: 1, minQuantity: 1 });
    const addonStep = makeStep({ id: "addon", isFreeGift: true, addonUnlockAfterCompletion: true });
    const allSteps = [step1, step2, addonStep];

    expect(isAddonStepLocked(addonStep, 2, allSteps)).toBe(false);
  });

  it("returns true when one prior step is under its minQuantity", () => {
    const step1 = makeStep({ id: "step-1", selectedQuantity: 1, minQuantity: 2 }); // under
    const step2 = makeStep({ id: "step-2", selectedQuantity: 1, minQuantity: 1 }); // ok
    const addonStep = makeStep({ id: "addon", isFreeGift: true, addonUnlockAfterCompletion: true });
    const allSteps = [step1, step2, addonStep];

    expect(isAddonStepLocked(addonStep, 2, allSteps)).toBe(true);
  });

  it("returns true when all prior steps have zero selected", () => {
    const step1 = makeStep({ id: "step-1", selectedQuantity: 0, minQuantity: 1 });
    const step2 = makeStep({ id: "step-2", selectedQuantity: 0, minQuantity: 1 });
    const addonStep = makeStep({ id: "addon", isFreeGift: true, addonUnlockAfterCompletion: true });
    const allSteps = [step1, step2, addonStep];

    expect(isAddonStepLocked(addonStep, 2, allSteps)).toBe(true);
  });

  it("treats a missing minQuantity as 1", () => {
    const step1 = makeStep({ id: "step-1", selectedQuantity: 0 }); // minQuantity defaults to 1
    const addonStep = makeStep({ id: "addon", isFreeGift: true, addonUnlockAfterCompletion: true });
    const allSteps = [step1, addonStep];

    expect(isAddonStepLocked(addonStep, 1, allSteps)).toBe(true);
  });

  it("only checks steps before the addon (not the addon itself)", () => {
    const addonStep = makeStep({ id: "addon", isFreeGift: true, addonUnlockAfterCompletion: true, selectedQuantity: 0 });
    const step2 = makeStep({ id: "step-2", selectedQuantity: 0, minQuantity: 1 });
    // addon is at index 0 — no prior steps
    const allSteps = [addonStep, step2];

    expect(isAddonStepLocked(addonStep, 0, allSteps)).toBe(false);
  });
});
