/**
 * Type definitions for Product Page Bundle Configuration.
 *
 * Shared types (StepProduct, BundleStep, ActionResponse, etc.) live in
 * app/types/bundle-configure.ts and are re-exported here for convenience.
 */

import type { PricingRule } from "../../../types/pricing";
import type { BundleStatus } from "../../../constants/bundle";

export type {
  StepProduct,
  BundleStep,
  BundleStatusSectionProps,
  ActionResponse,
  SyncProductResponse,
  PagesResponse,
  ThemeTemplatesResponse,
  WidgetValidationResponse,
} from "../../../types/bundle-configure";

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
  shopifyProductHandle?: string;
  bundleType: string;
  status: BundleStatus;
  templateName?: string;
  loadingGif?: string | null;
  steps: import("../../../types/bundle-configure").BundleStep[];
  pricing?: BundlePricing;
}

export interface LoaderData {
  bundle: BundleData;
  bundleProduct?: any;
  shop: string;
  apiKey: string;
  blockHandle: string;
}

export interface BundleProductCardProps {
  bundleProduct: any;
  productImageUrl: string;
  productTitle: string;
  shop: string;
  onOpenProduct?: () => void;
  onSync: () => void;
  onSelect: () => void;
}

export interface SaveBundleResponse extends import("../../../types/bundle-configure").ActionResponse {
  bundle?: BundleData;
}
