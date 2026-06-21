import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from "@remix-run/react";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { AppLogger } from "../../../lib/logger";
import { slugify, validateSlug } from "../../../lib/slug-utils";
import {
  getDefaultDiscountRuleSuccessMessage,
  getDefaultDiscountRuleText,
  normalizePricingDisplayOptions,
  normalizePricingRuleMessages,
  serializePricingDisplayOptions,
} from "../../../lib/pricing-display-options";
import {
  amountToCents,
  centsToAmount,
  createNewPricingRule,
  DiscountMethod,
} from "../../../types/pricing";
import {
  CATEGORY_CONDITION_OPERATOR_OPTIONS,
  DISCOUNT_METHOD_OPTIONS,
  STEP_CONDITION_OPERATOR_OPTIONS,
  STEP_CONDITION_TYPE_OPTIONS,
} from "../../../constants/bundle";
import { OptimisedImage } from "../../../components/OptimisedImage";
import { FilePicker } from "../../../components/shared/FilePicker";
import { BundleReadinessOverlay } from "../../../components/bundle-configure/BundleReadinessOverlay";
import { BundleGuidedTour } from "../../../components/bundle-configure/BundleGuidedTour";
import { FPB_TOUR_STEPS } from "../../../components/bundle-configure/tourSteps";
import { MultiLanguageTextModal } from "../../../components/bundle-configure/MultiLanguageTextModal";
import { DiscardChangesModal } from "../../../components/bundle-configure/DiscardChangesModal";
import { useBundleConfigurationState } from "../../../hooks/useBundleConfigurationState";
import { useEnsureProductTemplateMutation } from "../../../store/api/adminApi";
import { AppEmbedBanner } from "../../../components/AppEmbedBanner";
import { UnlistedBundleBanner } from "../../../components/UnlistedBundleBanner";
import { EnablePreviewModal } from "../../../components/EnablePreviewModal";
import { useEnablePreviewGate } from "../../../hooks/useEnablePreviewGate";
import {
  hidePolarisModal,
  showPolarisModal,
  useModalHideListener,
} from "../_shared/bundle-configure/modal-utils";
import { BundleStatusSection } from "../_shared/bundle-configure/BundleStatusSection";
import { useSharedBundleHandlers } from "../../../hooks/useSharedBundleHandlers";
import { INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE } from "../../../lib/bundle-config/product-page-admin-sections";
import {
  buildDefaultProductEntryFromPicker,
  normalizeDefaultProductsData,
} from "../../../lib/bundle-config/default-products";
import { deriveControlDependencies } from "../../../lib/bundle-config/control-dependencies";
import {
  ADDON_MESSAGE_KEY,
  ADDON_TEMPLATE_VARIABLES,
  ADDONS_HELP_ARTICLE_URL,
  FPB_DESIGN_CONTROL_PANEL_URL,
  TEMPLATE_VARIABLES,
  bundleSetupItems,
  bundleVisibilityChildItems,
  fullPageTemplateOptions,
  stepSetupChildItems,
} from "./configure-constants";
import {
  QuestionHelpTooltip,
  RichHelpTooltip,
  SettingsRow,
  VisibilityBadge,
} from "./SmallComponents";
import {
  asVisibilityArray,
  buildVisibilityDisplayConfiguration,
  buildVisibilitySelectionIds,
  getVisibilityDisplayTarget,
  getVisibilityPickerSelection,
  normalizeVisibilityCollectionForDisplayConfiguration,
  normalizeVisibilityCollectionPageTarget,
  normalizeVisibilityProductForDisplayConfiguration,
  normalizeVisibilityProductPageTarget,
} from "./visibility-helpers";
import {
  buildAddonDraftFromPersonalizationData,
  buildPersonalizationDataFromDraft,
  createDefaultAddonDraftTier,
  createDefaultAddonTierCondition,
  normalizeAddonPickerProduct,
} from "./addon-helpers";
import { ConfigureCanvasHeader } from "./ConfigureCanvasHeader";
import { ConfigureHiddenInputs } from "./ConfigureHiddenInputs";
import { ConfigureSidebar } from "./ConfigureSidebar";
import { StepSetupSection } from "./sections/StepSetupSection";
import { FreeGiftAddonsSection } from "./sections/FreeGiftAddonsSection";
import { DiscountPricingSection } from "./sections/DiscountPricingSection";
import { ImagesVisibilitySection } from "./sections/ImagesVisibilitySection";
import { BundleSettingsSection } from "./sections/BundleSettingsSection";
import { BundleWidgetSection } from "./sections/BundleWidgetSection";
import { ConfigureRouteModals } from "./sections/ConfigureRouteModals";
import type {
  ConfigureBundleFlowContextValue,
  ConfigureBundleFlowDraft,
} from "./configure-flow-types";

const configureFlowStaticValues = {
  ADDON_MESSAGE_KEY,
  ADDON_TEMPLATE_VARIABLES,
  ADDONS_HELP_ARTICLE_URL,
  amountToCents,
  AppEmbedBanner,
  AppLogger,
  asVisibilityArray,
  buildAddonDraftFromPersonalizationData,
  buildDefaultProductEntryFromPicker,
  buildPersonalizationDataFromDraft,
  buildVisibilityDisplayConfiguration,
  buildVisibilitySelectionIds,
  BundleGuidedTour,
  BundleReadinessOverlay,
  BundleSettingsSection,
  BundleStatusSection,
  bundleSetupItems,
  BundleWidgetSection,
  bundleVisibilityChildItems,
  CATEGORY_CONDITION_OPERATOR_OPTIONS,
  centsToAmount,
  ConfigureCanvasHeader,
  ConfigureHiddenInputs,
  ConfigureRouteModals,
  ConfigureSidebar,
  createDefaultAddonDraftTier,
  createDefaultAddonTierCondition,
  createNewPricingRule,
  deriveControlDependencies,
  DiscardChangesModal,
  DISCOUNT_METHOD_OPTIONS,
  DiscountMethod,
  DiscountPricingSection,
  EnablePreviewModal,
  FilePicker,
  FPB_DESIGN_CONTROL_PANEL_URL,
  FPB_TOUR_STEPS,
  FreeGiftAddonsSection,
  fullPageTemplateOptions,
  getDefaultDiscountRuleSuccessMessage,
  getDefaultDiscountRuleText,
  getVisibilityDisplayTarget,
  getVisibilityPickerSelection,
  hidePolarisModal,
  ImagesVisibilitySection,
  INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE,
  MultiLanguageTextModal,
  normalizeAddonPickerProduct,
  normalizeDefaultProductsData,
  normalizePricingDisplayOptions,
  normalizePricingRuleMessages,
  normalizeVisibilityCollectionForDisplayConfiguration,
  normalizeVisibilityCollectionPageTarget,
  normalizeVisibilityProductForDisplayConfiguration,
  normalizeVisibilityProductPageTarget,
  OptimisedImage,
  QuestionHelpTooltip,
  RichHelpTooltip,
  SaveBar,
  serializePricingDisplayOptions,
  SettingsRow,
  showPolarisModal,
  slugify,
  STEP_CONDITION_OPERATOR_OPTIONS,
  STEP_CONDITION_TYPE_OPTIONS,
  StepSetupSection,
  stepSetupChildItems,
  TEMPLATE_VARIABLES,
  UnlistedBundleBanner,
  useAppBridge,
  useBundleConfigurationState,
  useCallback,
  useEffect,
  useEnablePreviewGate,
  useEnsureProductTemplateMutation,
  useFetcher,
  useLoaderData,
  useMemo,
  useModalHideListener,
  useNavigate,
  useRef,
  useRevalidator,
  useSharedBundleHandlers,
  useState,
  validateSlug,
  VisibilityBadge,
};

export function buildConfigureBundleFlowContext(
  flow: ConfigureBundleFlowDraft,
): ConfigureBundleFlowContextValue {
  return {
    ...configureFlowStaticValues,
    ...flow,
  } as ConfigureBundleFlowContextValue;
}
