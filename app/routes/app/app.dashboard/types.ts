/**
 * Type definitions for Dashboard Route
 *
 * Extracted from the main route file for better organization.
 */

export interface BundleActionsButtonsProps {
  bundleId: string;
  bundleType: 'product_page' | 'full_page';
  onEdit: (bundle: any) => void;
  onClone: (bundleId: string) => void;
  onDelete: (bundleId: string) => void;
  onPreview: (bundle: any) => void;
  bundle: any;
}

export interface BundleWithPreview {
  id: string;
  name: string;
  bundleType: 'product_page' | 'full_page';
  status: 'active' | 'draft' | 'archived';
  shopifyProductId: string | null;
  shopifyPageHandle: string | null;
  previewHandle: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionInfo {
  plan: string;
  currentBundleCount: number;
  bundleLimit: number;
  canCreateBundle: boolean;
}

export interface LoaderData {
  bundles: BundleWithPreview[];
  shop: string;
  subscription: SubscriptionInfo | null;
  apiKey: string;
}

export interface ActionResponse {
  success: boolean;
  error?: string;
  bundleId?: string;
  bundleProductId?: string;
  redirectTo?: string;
}

export interface CloneBundleResponse extends ActionResponse {
  clonedBundleId?: string;
}

export interface CreateBundleResponse extends ActionResponse {
  bundleType?: 'product_page' | 'full_page';
}

export interface DeleteBundleResponse extends ActionResponse {
  deletedBundleId?: string;
}
