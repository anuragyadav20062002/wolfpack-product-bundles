export type RuleMode = "step" | "category";
export type DiscountMode = "percentage" | "fixed_amount" | "fixed_bundle_price" | "buy_x_get_y";
export type RuleBasis = "quantity" | "amount";
export type ProgressType = "simple" | "step_based";

export interface ControlDependencyInput {
  categoryCount?: number;
  ruleMode?: RuleMode;
  discountEnabled?: boolean;
  discountMode?: DiscountMode;
  ruleBasis?: RuleBasis;
  progressType?: ProgressType;
  quantityValidationEnabled?: boolean;
  preselectedProductsEnabled?: boolean;
  discountDisplayEnabled?: boolean;
}

export interface ControlDependencyState {
  categoryRulesVisible: boolean;
  stepRulesDisabled: boolean;
  categoryRulesDisabled: boolean;
  discountMessagingEnabled: boolean;
  bundleQuantityOptionsEnabled: boolean;
  boxSelectionCleared: boolean;
  progressTierTextVisible: boolean;
  maxQuantityEnabled: boolean;
  defaultProductDetailsEnabled: boolean;
  discountFormatEnabled: boolean;
}

export function deriveControlDependencies(input: ControlDependencyInput): ControlDependencyState {
  const categoryCount = input.categoryCount ?? 0;
  const ruleMode = input.ruleMode ?? "step";
  const discountEnabled = input.discountEnabled ?? false;
  const discountMode = input.discountMode ?? "percentage";
  const ruleBasis = input.ruleBasis ?? "quantity";
  const categoryRulesVisible = categoryCount > 1;
  const isBxy = discountMode === "buy_x_get_y";

  return {
    categoryRulesVisible,
    stepRulesDisabled: categoryRulesVisible && ruleMode === "category",
    categoryRulesDisabled: !categoryRulesVisible || ruleMode === "step",
    discountMessagingEnabled: discountEnabled,
    bundleQuantityOptionsEnabled: discountEnabled && !isBxy && ruleBasis === "quantity",
    boxSelectionCleared: isBxy,
    progressTierTextVisible: input.progressType === "step_based",
    maxQuantityEnabled: input.quantityValidationEnabled === true,
    defaultProductDetailsEnabled: input.preselectedProductsEnabled === true,
    discountFormatEnabled: input.discountDisplayEnabled === true,
  };
}
