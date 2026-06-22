import type { ComponentType, useState } from "react";
import type { FilePickerProps } from "../../../components/shared/file-picker/types";

type StateSetter<T> = (value: T | ((prev: T) => T)) => void;

export type ConfigureBundleFlowDraft = Record<string, any>;

export type ConfigureBundleFlowContextValue = ConfigureBundleFlowDraft & {
  ADDON_TEMPLATE_VARIABLES: [string, string][];
  DISCOUNT_METHOD_OPTIONS: Array<{ label: string; value: string }>;
  TEMPLATE_VARIABLES: [string, string][];
  bundleSetupItems: Array<{ id: string; label: string; [key: string]: unknown }>;
  bundleVisibilityChildItems: Array<{ id: string; label: string }>;
  fullPageTemplateOptions: Array<{
    presetId: string;
    label: string;
    image: string;
  }>;
  FilePicker: ComponentType<FilePickerProps>;
  stepSetupChildItems: Array<{ id: string; label: string }>;
  useState: typeof useState;
  availablePages: Array<Record<string, any>>;
  bundleBannerDesktopUrl: string;
  bundleBannerMobileUrl: string;
  bundleLevelCss: string;
  bundleLevelCssExpanded: boolean;
  defaultProductsData: any;
  loadingGif: string | null;
  promoBannerBgImage: string | null;
  pricingState: Record<string, any> & {
    discountRules: any[];
    setDiscountMessagingEnabled: StateSetter<boolean>;
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
  productMenuOpen: boolean;
  setActiveAssetTabIndex: StateSetter<number>;
  setBundleBannerDesktopUrl: StateSetter<string>;
  setBundleBannerMobileUrl: StateSetter<string>;
  setBundleLevelCss: StateSetter<string>;
  setBundleLevelCssExpanded: StateSetter<boolean>;
  setDefaultProductsData: StateSetter<any>;
  setLoadingGif: StateSetter<string | null>;
  setProductMenuOpen: StateSetter<boolean>;
  setPromoBannerBgImage: StateSetter<string | null>;
  setRuleMessages: StateSetter<any>;
  setRuleMessagesByLocale: StateSetter<any>;
  setTextOverrides: StateSetter<Record<string, string>>;
  setTextOverridesByLocale: StateSetter<any>;
  shopLocales: Array<{ locale: string; name: string; primary: boolean }>;
  stepsState: Record<string, any> & {
    steps: any[];
    setSteps: StateSetter<any[]>;
    updateStepField: (stepId: string, field: string, value: any) => void;
  };
};
