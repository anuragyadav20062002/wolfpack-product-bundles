/**
 * Type definitions for Dashboard Route
 *
 * Extracted from the main route file for better organization.
 */

import type { BundleStatus, BundleType } from "../../../constants/bundle";

export interface BundleActionsButtonsProps {
  bundleId: string;
  bundleType: BundleType | string;
  onEdit: (bundle: any) => void;
  onClone: (bundleId: string) => void;
  onDelete: (bundleId: string) => void;
  onPreview: (bundle: any) => void;
  bundle: any;
  moreOpen: boolean;
  onMoreToggle: () => void;
}

export interface BundleWithPreview {
  id: string;
  name: string;
  bundleType: BundleType;
  status: BundleStatus;
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
  bundleType?: BundleType;
}

export interface DeleteBundleResponse extends ActionResponse {
  deletedBundleId?: string;
}
