/**
 * Shared type definitions for bundle configure pages (FPB + PPB).
 *
 * Route-specific types (BundleData, BundlePricing, LoaderData) live in each
 * route's own types.ts because they carry different fields.
 */

import type { BundleStatus } from "../constants/bundle";

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

export interface BundleStatusSectionProps {
  status: BundleStatus;
  onChange: (status: BundleStatus) => void;
  showHeading?: boolean;
}

export interface ActionResponse {
  success: boolean;
  error?: string;
  message?: string;
  data?: any;
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
