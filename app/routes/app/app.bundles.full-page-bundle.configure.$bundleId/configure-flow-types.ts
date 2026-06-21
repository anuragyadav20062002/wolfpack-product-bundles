type StateSetter<T> = (value: T | ((prev: T) => T)) => void;

export type ConfigureBundleFlowDraft = Record<string, any>;

export type ConfigureBundleFlowContextValue = ConfigureBundleFlowDraft & {
  defaultProductsData: any;
  pricingState: Record<string, any> & {
    discountRules: any[];
    setDiscountRules: StateSetter<any[]>;
    setBundleQuantityOptions: StateSetter<any>;
    setBundleQuantityRuleLabels: StateSetter<Record<string, string>>;
    setBundleQuantityRuleSubtexts: StateSetter<Record<string, string>>;
    setProgressBarRuleTexts: StateSetter<Record<string, string>>;
    setRuleMessages: StateSetter<any>;
    setRuleMessagesByLocale: StateSetter<any>;
    setSuccessMessageByLocale: StateSetter<Record<string, string>>;
    setTierTextByLocaleByRuleId: StateSetter<any>;
    setTierTextByRuleId: StateSetter<Record<string, string>>;
  };
  setDefaultProductsData: StateSetter<any>;
  setRuleMessages: StateSetter<any>;
  setRuleMessagesByLocale: StateSetter<any>;
  setTextOverrides: StateSetter<Record<string, string>>;
  setTextOverridesByLocale: StateSetter<any>;
  stepsState: Record<string, any> & {
    steps: any[];
    setSteps: StateSetter<any[]>;
  };
};
