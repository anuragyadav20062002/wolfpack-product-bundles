import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import type { BundleStatus } from "../../../../constants/bundle";
import { AppLogger } from "../../../../lib/logger";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../../../../services/bundles/metafield-sync.server";
import {
  convertBundleToStandardMetafields,
  updateProductStandardMetafields,
} from "../../../../services/bundles/standard-metafields.server";
import { getBundleProductVariantId } from "../../../../utils/variant-lookup.server";
import { buildBundleBaseConfig } from "./runtime-config.server";

type SaveBundleMetafieldSyncInput = {
  admin: ShopifyAdmin;
  bundleId: string;
  finalStatus: BundleStatus;
  updatedBundle: SavedBundleForMetafieldSync;
  stepsData: any[];
  stepConditionsData: Record<string, any[]>;
  discountData: any;
};

type SavedBundleForMetafieldSync = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  bundleType: string;
  templateName: string | null;
  shopifyProductId: string | null;
  shopifyProductHandle: string | null;
  bundleDesignTemplate?: string | null;
  bundleDesignPresetId?: string | null;
  defaultProductsData?: unknown;
  boxSelection?: unknown;
  bundleUpsellConfig?: unknown;
  bundleTextConfig?: unknown;
  discountDisplayOverride?: unknown;
  individualSellingPlanSelection?: unknown;
  validateQuantityPerProduct?: unknown;
  useSingleStepCategoriesAsBundleSteps?: boolean | null;
  pricing?: {
    displayOptions?: unknown;
    messages?: unknown;
  } | null;
  steps: any[];
};

export async function syncSavedBundleMetafields({
  admin,
  updatedBundle,
  stepsData,
  stepConditionsData,
  discountData,
}: SaveBundleMetafieldSyncInput) {
  if (!updatedBundle.shopifyProductId) return;

  const bundleParentVariantId = await getBundleProductVariantId(
    admin,
    updatedBundle.shopifyProductId,
  );
  AppLogger.debug(
    `[BUNDLE_CONFIG] Bundle parent variant ID: ${bundleParentVariantId}`,
  );

  const baseConfiguration = buildBundleBaseConfig(
    updatedBundle,
    stepsData,
    stepConditionsData,
    discountData,
    bundleParentVariantId,
  );

  const configSize = JSON.stringify(baseConfiguration).length;
  AppLogger.debug(
    "[METAFIELD] Optimized configuration size:",
    {},
    `${configSize} chars`,
  );

  const fullBundleConfig = {
    ...baseConfiguration,
    steps: updatedBundle.steps.map((step: any) => {
      const { timelineIconUrl, ...publicStep } = step;
      return {
        ...publicStep,
        stepImage: timelineIconUrl ?? null,
      };
    }),
  };

  if (!fullBundleConfig.steps || fullBundleConfig.steps.length === 0) {
    AppLogger.error("[VALIDATION] Cannot save bundle: No steps defined");
    throw new Error("Please add at least one step to your bundle before saving");
  }

  const hasProducts = fullBundleConfig.steps.some(
    (step: any) =>
      (step.StepProduct && step.StepProduct.length > 0) ||
      (step.products && step.products.length > 0) ||
      (Array.isArray(step.collections) && step.collections.length > 0) ||
      (Array.isArray(step.StepCategory) &&
        step.StepCategory.some(
          (cat: any) =>
            (Array.isArray(cat.products) && cat.products.length > 0) ||
            (Array.isArray(cat.collections) && cat.collections.length > 0),
        )),
  );

  if (!hasProducts) {
    AppLogger.error(
      "[VALIDATION] Cannot save bundle: No products found in any step",
    );
    throw new Error("Please add products to at least one step before saving");
  }

  if (!updatedBundle.shopifyProductId) {
    AppLogger.error(
      "[VALIDATION] Cannot update metafields: No Shopify product ID",
    );
    throw new Error("Bundle must have a Shopify product ID to update metafields");
  }

  const shopifyProductId = updatedBundle.shopifyProductId;

  AppLogger.debug("[METAFIELDS] Updating all metafields in parallel");
  const [standardResult, componentResult, variantResult] =
    await Promise.allSettled([
      (async () => {
        AppLogger.debug(
          "[STANDARD_METAFIELD] Updating standard Shopify metafields for bundle product",
        );
        const { metafields: standardMetafields, errors: conversionErrors } =
          await convertBundleToStandardMetafields(admin, baseConfiguration);
        if (conversionErrors.length > 0) {
          AppLogger.warn(
            "[STANDARD_METAFIELD] Some products could not be processed:",
            conversionErrors,
          );
        }
        if (Object.keys(standardMetafields).length > 0) {
          await updateProductStandardMetafields(
            admin,
            shopifyProductId,
            standardMetafields,
          );
          AppLogger.debug(
            "[STANDARD_METAFIELD] Standard metafields updated successfully",
          );
        } else {
          AppLogger.debug("[STANDARD_METAFIELD] No standard metafields to update");
        }
      })(),
      updateComponentProductMetafields(
        admin,
        shopifyProductId,
        fullBundleConfig,
      ),
      updateBundleProductMetafields(admin, shopifyProductId, fullBundleConfig),
    ]);

  if (standardResult.status === "rejected") {
    AppLogger.warn(
      "[STANDARD_METAFIELD] Standard metafields update failed (non-critical):",
      {
        component: "handlers.server",
        shopifyProductId,
      },
      standardResult.reason,
    );
  }
  if (componentResult.status === "rejected") {
    throw new Error(
      `Failed to update component metafields (cart transform will break): ${componentResult.reason}`,
    );
  }
  if (variantResult.status === "rejected") {
    throw new Error(
      `Failed to update bundle variant metafields (widget will not load): ${variantResult.reason}`,
    );
  }

  AppLogger.debug("[METAFIELDS] All metafields updated successfully");
}
