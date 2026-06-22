import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  useLoaderData,
  useNavigate,
  useFetcher,
  useRevalidator,
} from "@remix-run/react";
import { AppLogger } from "../../../lib/logger";
import {
  DiscountMethod,
  centsToAmount,
  amountToCents,
  createNewPricingRule,
} from "../../../types/pricing";
import {
  STEP_CONDITION_TYPE_OPTIONS,
  STEP_CONDITION_OPERATOR_OPTIONS,
  CATEGORY_CONDITION_OPERATOR_OPTIONS,
  DISCOUNT_METHOD_OPTIONS,
} from "../../../constants/bundle";
import { getParentProductStatusUi } from "../../../lib/parent-product-status-ui";
import { handleAdminSaveLockedEvent } from "../../../lib/admin-save-lock";
import { FilePicker } from "../../../components/shared/FilePicker";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
import { useBundleConfigurationState } from "../../../hooks/useBundleConfigurationState";
import productPageBundleStyles from "../../../styles/routes/product-page-bundle-configure.module.css";
import { UnlistedBundleBanner } from "../../../components/UnlistedBundleBanner";
import { EnablePreviewModal } from "../../../components/EnablePreviewModal";
import { useEnablePreviewGate } from "../../../hooks/useEnablePreviewGate";
import { pickPpbPreviewUrl } from "../../../lib/ppb-preview-url";
import { BundleReadinessOverlay } from "../../../components/bundle-configure/BundleReadinessOverlay";
import { BundleGuidedTour } from "../../../components/bundle-configure/BundleGuidedTour";
import { PPB_TOUR_STEPS } from "../../../components/bundle-configure/tourSteps";
import { MultiLanguageTextModal } from "../../../components/bundle-configure/MultiLanguageTextModal";
import { DiscardChangesModal } from "../../../components/bundle-configure/DiscardChangesModal";
import {
  showPolarisModal,
  hidePolarisModal,
  useModalHideListener,
} from "../_shared/bundle-configure/modal-utils";
import { BundleStatusSection } from "../_shared/bundle-configure/BundleStatusSection";
import { useSharedBundleHandlers } from "../../../hooks/useSharedBundleHandlers";
import {
  DEFAULT_PROGRESS_BAR_PROGRESS_TEXT,
  DEFAULT_PROGRESS_BAR_SUCCESS_TEXT,
  getDefaultDiscountRuleSuccessMessage,
  getDefaultDiscountRuleText,
} from "../../../lib/pricing-display-options";
import { deriveControlDependencies } from "../../../lib/bundle-config/control-dependencies";
import {
  INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE,
  PRODUCT_PAGE_EDIT_DEFAULTS_HREF,
  SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE,
  buildProductPageThemeEditorDeepLink,
  resolveProductPageTemplateSuffix,
} from "../../../lib/bundle-config/product-page-admin-sections";
import {
  buildDefaultProductEntryFromPicker,
  normalizeDefaultProductsData,
} from "../../../lib/bundle-config/default-products";
import {
  ADDON_TEMPLATE_VARIABLES,
  DISCOUNT_TEMPLATE_VARIABLES,
  PPB_DESIGN_CONTROL_PANEL_URL,
  QuestionHelpTooltip,
  VisibilityBadge,
  asVisibilityArray,
  buildVisibilityDisplayConfiguration,
  buildVisibilitySelectionIds,
  bundleSetupItems,
  bundleVisibilityChildItems,
  getVisibilityDisplayTarget,
  getVisibilityPickerSelection,
  getVisibilityResourceId,
  normalizeVisibilityCollectionForDisplayConfiguration,
  normalizeVisibilityCollectionPageTarget,
  normalizeVisibilityProductForDisplayConfiguration,
  normalizeVisibilityProductPageTarget,
  productPageTemplateOptions,
} from "./ConfigureBundleFlow.helpers";

export const ppbConfigureFlowStaticExports = {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useLoaderData,
  useNavigate,
  useFetcher,
  useRevalidator,
  AppLogger,
  DiscountMethod,
  centsToAmount,
  amountToCents,
  createNewPricingRule,
  STEP_CONDITION_TYPE_OPTIONS,
  STEP_CONDITION_OPERATOR_OPTIONS,
  CATEGORY_CONDITION_OPERATOR_OPTIONS,
  DISCOUNT_METHOD_OPTIONS,
  getParentProductStatusUi,
  handleAdminSaveLockedEvent,
  FilePicker,
  useAppBridge,
  SaveBar,
  useBundleConfigurationState,
  productPageBundleStyles,
  UnlistedBundleBanner,
  EnablePreviewModal,
  useEnablePreviewGate,
  pickPpbPreviewUrl,
  BundleReadinessOverlay,
  BundleGuidedTour,
  PPB_TOUR_STEPS,
  MultiLanguageTextModal,
  DiscardChangesModal,
  showPolarisModal,
  hidePolarisModal,
  useModalHideListener,
  BundleStatusSection,
  useSharedBundleHandlers,
  DEFAULT_PROGRESS_BAR_PROGRESS_TEXT,
  DEFAULT_PROGRESS_BAR_SUCCESS_TEXT,
  getDefaultDiscountRuleSuccessMessage,
  getDefaultDiscountRuleText,
  deriveControlDependencies,
  INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE,
  PRODUCT_PAGE_EDIT_DEFAULTS_HREF,
  SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE,
  buildProductPageThemeEditorDeepLink,
  resolveProductPageTemplateSuffix,
  buildDefaultProductEntryFromPicker,
  normalizeDefaultProductsData,
  ADDON_TEMPLATE_VARIABLES,
  DISCOUNT_TEMPLATE_VARIABLES,
  PPB_DESIGN_CONTROL_PANEL_URL,
  QuestionHelpTooltip,
  VisibilityBadge,
  asVisibilityArray,
  buildVisibilityDisplayConfiguration,
  buildVisibilitySelectionIds,
  bundleSetupItems,
  bundleVisibilityChildItems,
  getVisibilityDisplayTarget,
  getVisibilityPickerSelection,
  getVisibilityResourceId,
  normalizeVisibilityCollectionForDisplayConfiguration,
  normalizeVisibilityCollectionPageTarget,
  normalizeVisibilityProductForDisplayConfiguration,
  normalizeVisibilityProductPageTarget,
  productPageTemplateOptions,
};
