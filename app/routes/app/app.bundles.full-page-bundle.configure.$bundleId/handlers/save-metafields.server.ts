import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import { getBundleProductVariantId } from "../../../../utils/variant-lookup.server";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../../../../services/bundles/metafield-sync.server";
import {
  convertBundleToStandardMetafields,
  updateProductStandardMetafields,
} from "../../../../services/bundles/standard-metafields.server";
import { buildFpbBaseConfig } from "./shared.server";

export async function syncSavedFpbBundleStorefrontState({
  admin,
  bundleId,
  directBoxSelection,
  discountData,
  shopDomain,
  stepConditionsData,
  stepsData,
  updatedBundle,
}: {
  admin: ShopifyAdmin;
  bundleId: string;
  directBoxSelection: any;
  discountData: any;
  shopDomain: string;
  stepConditionsData: Record<string, any[]>;
  stepsData: any[];
  updatedBundle: any;
}) {
  if (updatedBundle.shopifyProductId) {
    await syncSavedFpbBundleProductState({
      admin,
      bundleId,
      directBoxSelection,
      discountData,
      stepConditionsData,
      stepsData,
      updatedBundle,
    });
  }

}

async function syncSavedFpbBundleProductState({
  admin,
  bundleId,
  directBoxSelection,
  discountData,
  stepConditionsData,
  stepsData,
  updatedBundle,
}: {
  admin: ShopifyAdmin;
  bundleId: string;
  directBoxSelection: any;
  discountData: any;
  stepConditionsData: Record<string, any[]>;
  stepsData: any[];
  updatedBundle: any;
}) {
  const bundleParentVariantId = await getBundleProductVariantId(
    admin,
    updatedBundle.shopifyProductId,
  );
  AppLogger.debug(
    `[BUNDLE_CONFIG] Bundle parent variant ID: ${bundleParentVariantId}`,
  );

  const baseConfiguration = buildFpbBaseConfig(
    updatedBundle,
    stepsData,
    stepConditionsData,
    discountData,
    bundleParentVariantId,
    directBoxSelection,
  );

  AppLogger.debug(
    "[METAFIELD] Optimized configuration size:",
    {},
    `${JSON.stringify(baseConfiguration).length} chars (vs 12KB+ before)`,
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

  validateFpbBundleConfigForMetafields(fullBundleConfig);

  const shopifyProductId = updatedBundle.shopifyProductId;
  AppLogger.debug("[METAFIELDS] Updating all metafields in parallel");
  const [standardResult, componentResult, variantResult] =
    await Promise.allSettled([
      updateStandardMetafields(admin, shopifyProductId, baseConfiguration),
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
      { component: "handlers.server", shopifyProductId },
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

function validateFpbBundleConfigForMetafields(fullBundleConfig: any) {
  if (!fullBundleConfig.steps || fullBundleConfig.steps.length === 0) {
    AppLogger.error("[VALIDATION] Cannot save bundle: No steps defined");
    throw new Error(
      "Please add at least one step to your bundle before saving",
    );
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
}

async function updateStandardMetafields(
  admin: ShopifyAdmin,
  shopifyProductId: string,
  baseConfiguration: any,
) {
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
  if (Object.keys(standardMetafields).length === 0) {
    AppLogger.debug("[STANDARD_METAFIELD] No standard metafields to update");
    return;
  }
  await updateProductStandardMetafields(
    admin,
    shopifyProductId,
    standardMetafields,
  );
  AppLogger.debug(
    "[STANDARD_METAFIELD] Standard metafields updated successfully",
  );
}
