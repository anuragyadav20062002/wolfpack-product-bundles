/**
 * Test Spec: free-gift-validation-gating
 *
 * Verifies the FPB storefront widget keeps paid bundle validation authoritative
 * while treating the EB-style add-on step as optional.
 */

export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageValidationAddonsMethods } =
  require('../../../app/assets/widgets/full-page/methods/validation-addons-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageSelectionNavigationMethods } =
  require('../../../app/assets/widgets/full-page/methods/selection-navigation-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageFooterSelectionMethods } =
  require('../../../app/assets/widgets/full-page/methods/footer-selection-methods.js');

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
    /** When false, simulate that prior paid steps are incomplete. */
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

  it('returns true when on a paid step that is satisfied and the NEXT step is an optional add-on step', () => {
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
    ).toBe(true);
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

  it('allows navigation to the add-on step when a saved paid step rule has value 0 and min quantity is met', () => {
    const ctx = Object.assign(
      Object.create(fullPageValidationAddonsMethods),
      fullPageSelectionNavigationMethods,
      fullPageFooterSelectionMethods,
    ) as Record<string, unknown>;
    ctx.selectedBundle = {
      steps: [
        {
          conditionType: 'quantity',
          conditionOperator: 'equal_to',
          conditionValue: 0,
          minQuantity: 1,
        },
        {
          isFreeGift: true,
          addonTiers: [
            {
              eligibilityCondition: { type: 'QUANTITY', value: 1 },
              selectedAddonProducts: [{ id: 'p1' }],
            },
          ],
        },
      ],
    };
    ctx.selectedProducts = [{ v1: 1 }, {}];
    ctx.stepProductData = [[{ id: 'p1', variantId: 'v1' }], []];
    ctx.currentStepIndex = 0;
    ctx.extractId = (value: string) => value;

    expect((ctx.validateStep as (index: number) => boolean)(0)).toBe(true);
    expect((ctx.isStepCompleted as (index: number) => boolean)(0)).toBe(true);
    expect(isFreeGiftUnlockedGetter.call(ctx)).toBe(true);
    expect((ctx.canNavigateToStep as (index: number) => boolean)(1)).toBe(true);
    expect((ctx.isStepAccessible as (index: number) => boolean)(1)).toBe(true);
    expect(canProceedToNextStepFn.call(ctx)).toBe(true);
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

  it('returns true when paid steps are complete even if the add-on threshold is unmet', () => {
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
    ).toBe(true);
  });

  it('returns false when any paid step before the add-on step is incomplete', () => {
    const steps: Step[] = [
      { minQuantity: 1 },
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
      callIsUnlocked({
        steps,
        completedStepIndexes: [0],
        addonEligible: true,
      }),
    ).toBe(false);
  });
});
