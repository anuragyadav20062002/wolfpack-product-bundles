/**
 * Test Spec: free-gift-validation-gating
 *
 * Verifies the FPB storefront widget's validation gates honour the addon-tier
 * rule on the free-gift step. Without these gates, a Free-Gift bundle with
 * `addonEligibilityCondition` set on the free-gift step shows "Add to Cart"
 * on the paid step and lets the shopper bypass the configured threshold —
 * see loom https://www.loom.com/share/5af3ea258fab462ba5216723d40ec89b.
 */

export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageValidationAddonsMethods } =
  require('../../../app/assets/widgets/full-page/methods/validation-addons-methods.js');

type Step = {
  isFreeGift?: boolean;
  isDefault?: boolean;
  conditionType?: string | null;
  conditionOperator?: string | null;
  conditionValue?: number | null;
  minQuantity?: number;
  addonEligibilityCondition?: { type?: string; value?: number } | null;
  addonTiers?: Array<{
    eligibilityCondition?: { type?: string; value?: number };
    selectedAddonProducts?: unknown[];
    discount?: { type?: string; value?: number };
  }>;
};

const bundleHasNoConditionsFn = fullPageValidationAddonsMethods.bundleHasNoConditions;
const canProceedToNextStepFn = fullPageValidationAddonsMethods.canProceedToNextStep;
const isFreeGiftUnlockedGetter = Object.getOwnPropertyDescriptor(
  fullPageValidationAddonsMethods,
  'isFreeGiftUnlocked',
)?.get;
if (
  typeof bundleHasNoConditionsFn !== 'function' ||
  typeof canProceedToNextStepFn !== 'function' ||
  typeof isFreeGiftUnlockedGetter !== 'function'
) {
  throw new Error('Expected methods missing on validation-addons module');
}

// ---- bundleHasNoConditions ------------------------------------------------

describe('bundleHasNoConditions', () => {
  function call(steps: Step[]): boolean {
    const ctx = { selectedBundle: { steps } };
    return bundleHasNoConditionsFn.call(ctx) as boolean;
  }

  it('returns false when there are no steps', () => {
    expect(call([])).toBe(false);
  });

  it('returns true for a single paid step with no conditionType', () => {
    expect(call([{}])).toBe(true);
  });

  it('returns true when paid step has no condition and free-gift step has no addon rule', () => {
    expect(call([{}, { isFreeGift: true }])).toBe(true);
  });

  it('returns false when free-gift step has addonEligibilityCondition with value > 0', () => {
    expect(
      call([
        {},
        {
          isFreeGift: true,
          addonEligibilityCondition: { type: 'QUANTITY', value: 1 },
        },
      ]),
    ).toBe(false);
  });

  it('returns false when free-gift step has addonTiers[0] with eligibilityCondition.value > 0', () => {
    expect(
      call([
        {},
        {
          isFreeGift: true,
          addonTiers: [
            {
              eligibilityCondition: { type: 'QUANTITY', value: 1 },
              selectedAddonProducts: [],
            },
          ],
        },
      ]),
    ).toBe(false);
  });

  it('returns false when free-gift step has addon products selected, even with eligibility value 0', () => {
    expect(
      call([
        {},
        {
          isFreeGift: true,
          addonTiers: [
            {
              eligibilityCondition: { type: 'QUANTITY', value: 0 },
              selectedAddonProducts: [{ id: 'p1' }],
            },
          ],
        },
      ]),
    ).toBe(false);
  });

  it('returns false when paid step has conditionType set (existing behavior)', () => {
    expect(call([{ conditionType: 'BUNDLE_QUANTITY', conditionValue: 3 }])).toBe(false);
  });

  it('returns true for default + paid + free-gift with no rules anywhere', () => {
    expect(call([{ isDefault: true }, {}, { isFreeGift: true }])).toBe(true);
  });
});

// ---- canProceedToNextStep -------------------------------------------------

describe('canProceedToNextStep', () => {
  function callCanProceed(args: {
    steps: Step[];
    currentStepIndex: number;
    /** When false, simulate a current paid step that is NOT yet complete. */
    currentStepCompleted: boolean;
    /** When false, simulate that the addon eligibility threshold is unmet. */
    freeGiftUnlocked: boolean;
  }): boolean {
    const ctx: Record<string, unknown> = {
      selectedBundle: { steps: args.steps },
      selectedProducts: {},
      currentStepIndex: args.currentStepIndex,
      // Stub isStepCompleted: this is what the production
      // `canProceedToNextStep` delegates to.
      isStepCompleted(_idx: number) {
        return args.currentStepCompleted;
      },
    };

    // Stub the isFreeGiftUnlocked getter on the bound `this`.
    Object.defineProperty(ctx, 'isFreeGiftUnlocked', {
      get: () => args.freeGiftUnlocked,
      configurable: true,
    });

    return canProceedToNextStepFn.call(ctx) as boolean;
  }

  it('returns false when on a paid step that is satisfied but the NEXT step is a locked free-gift', () => {
    const steps: Step[] = [
      { minQuantity: 1 },
      {
        isFreeGift: true,
        addonTiers: [
          {
            eligibilityCondition: { type: 'QUANTITY', value: 5 },
            selectedAddonProducts: [],
          },
        ],
      },
    ];
    expect(
      callCanProceed({
        steps,
        currentStepIndex: 0,
        currentStepCompleted: true,
        freeGiftUnlocked: false,
      }),
    ).toBe(false);
  });

  it('returns true when on a paid step that is satisfied and free-gift is unlocked', () => {
    const steps: Step[] = [
      { minQuantity: 1 },
      {
        isFreeGift: true,
        addonTiers: [
          {
            eligibilityCondition: { type: 'QUANTITY', value: 1 },
            selectedAddonProducts: [],
          },
        ],
      },
    ];
    expect(
      callCanProceed({
        steps,
        currentStepIndex: 0,
        currentStepCompleted: true,
        freeGiftUnlocked: true,
      }),
    ).toBe(true);
  });

  it('returns false when current paid step is NOT satisfied (existing behavior)', () => {
    const steps: Step[] = [{ minQuantity: 3 }, { isFreeGift: true }];
    expect(
      callCanProceed({
        steps,
        currentStepIndex: 0,
        currentStepCompleted: false,
        freeGiftUnlocked: false,
      }),
    ).toBe(false);
  });

  it('returns true when bundle has no free-gift step and current step is completed (existing behavior)', () => {
    const steps: Step[] = [{ minQuantity: 1 }, { minQuantity: 1 }];
    expect(
      callCanProceed({
        steps,
        currentStepIndex: 0,
        currentStepCompleted: true,
        freeGiftUnlocked: false,
      }),
    ).toBe(true);
  });

  it('returns true when on the free-gift step itself and its own (trivial) condition is met', () => {
    const steps: Step[] = [{ minQuantity: 1 }, { isFreeGift: true }];
    expect(
      callCanProceed({
        steps,
        currentStepIndex: 1,
        currentStepCompleted: true,
        freeGiftUnlocked: true,
      }),
    ).toBe(true);
  });
});

// ---- isFreeGiftUnlocked -----------------------------------------------------

describe('isFreeGiftUnlocked', () => {
  function callIsUnlocked(args: {
    steps: Step[];
    completedStepIndexes: number[];
    addonEligible: boolean;
  }): boolean {
    const ctx = Object.create(fullPageValidationAddonsMethods) as Record<string, unknown>;
    ctx.selectedBundle = { steps: args.steps };
    ctx.selectedProducts = {};
    ctx.stepProductData = [];
    ctx.isStepCompleted = (idx: number) => args.completedStepIndexes.includes(idx);
    ctx.getAddonEligibilityState = () => ({ isEligible: args.addonEligible });

    return isFreeGiftUnlockedGetter.call(ctx) as boolean;
  }

  it('returns false when paid steps are complete but the free-gift add-on threshold is unmet', () => {
    const steps: Step[] = [
      { minQuantity: 1 },
      {
        isFreeGift: true,
        addonTiers: [
          {
            eligibilityCondition: { type: 'QUANTITY', value: 5 },
            selectedAddonProducts: [],
          },
        ],
      },
    ];

    expect(
      callIsUnlocked({
        steps,
        completedStepIndexes: [0],
        addonEligible: false,
      }),
    ).toBe(false);
  });
});
