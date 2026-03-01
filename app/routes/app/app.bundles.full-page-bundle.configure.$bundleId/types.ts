/**
 * Type definitions for Full Page Bundle Configuration
 *
 * Extracted from the main route file for better organization.
 */

import type { PricingRule } from "../../../types/pricing";
export type { BundleStatus } from "../../../constants/bundle";

export interface StepProduct {
  id: string;
  productId: string;
  title: string;
}

export interface BundleStep {
  id: string;
  name: string;
  collections?: any;
  StepProduct?: StepProduct[];
}

export interface BundlePricing {
  id: string;
  enabled: boolean;
  method: string;
  rules: PricingRule[] | string;
  showFooter: boolean;
  messages: any;
}

export interface BundleData {
  id: string;
  name: string;
  description?: string;
  shopId: string;
  shopifyProductId?: string;
  shopifyPageHandle?: string;
  shopifyPageId?: string;
  bundleType: string;
  status: BundleStatus;
  templateName?: string;
  fullPageLayout?: string | null;
  steps: BundleStep[];
  pricing?: BundlePricing;
}

export interface LoaderData {
  bundle: BundleData;
  bundleProduct?: any;
  shop: string;
  apiKey: string;
  blockHandle: string;
}

export interface BundleStatusSectionProps {
  status: BundleStatus;
  onChange: (status: BundleStatus) => void;
}

// Action response types
export interface ActionResponse {
  success: boolean;
  error?: string;
  message?: string;
  data?: any;
}

export interface SaveBundleResponse extends ActionResponse {
  bundle?: BundleData;
}

export interface SyncProductResponse extends ActionResponse {
  product?: any;
  metafieldsUpdated?: boolean;
}

export interface PagesResponse extends ActionResponse {
  pages?: Array<{
    id: string;
    title: string;
    handle: string;
  }>;
}

export interface ThemeTemplatesResponse extends ActionResponse {
  templates?: Array<{
    id: string;
    name: string;
    handle: string;
  }>;
  currentTheme?: {
    id: string;
    name: string;
  };
}

export interface WidgetValidationResponse extends ActionResponse {
  widgetInstalled?: boolean;
  bundleConfigured?: boolean;
  recommendedAction?: string;
}
