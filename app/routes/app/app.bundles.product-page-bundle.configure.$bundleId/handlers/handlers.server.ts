/**
 * Action Handlers for Product Page Bundle Configuration
 *
 * Extracted from the main route file for better organization.
 * Each handler processes a specific action intent from the route's action function.
 */

import { json } from "@remix-run/node";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import type { Session } from "@shopify/shopify-api";
import { AppLogger } from "../../../../lib/logger";
import db from "../../../../db.server";
import { WidgetInstallationService } from "../../../../services/widget-installation.server";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../../../../services/bundles/metafield-sync.server";
import {
  calculateBundlePrice,
  updateBundleProductPrice,
} from "../../../../services/bundles/pricing-calculation.server";
import {
  convertBundleToStandardMetafields,
  updateProductStandardMetafields,
} from "../../../../services/bundles/standard-metafields.server";
import { getBundleProductVariantId } from "../../../../utils/variant-lookup.server";
import { parseConditionValue } from "../../../../lib/parse-condition-value";
import { mapDiscountMethod } from "../../../../utils/discount-mappers";
import { parsePPBGiftMessages, parsePPBBundleVisibility, parsePPBBundleSettings, parseBundleDesignTemplate } from "./parsers";
import {
  normaliseShopifyProductId,
  safeJsonParse,
  handleUpdateBundleStatus,
  handleUpdateBundleProduct,
  handleGetPages,
  handleGetThemeTemplates,
  handleGetCurrentTheme,
  handleEnsureBundleTemplates,
} from "../../../../services/bundles/bundle-configure-handlers.server";
import { BundleStatus, BundleType } from "../../../../constants/bundle";
import { ERROR_MESSAGES } from "../../../../constants/errors";
import { buildStepCategoryCreateInput } from "../../../../lib/bundle-config/category-persistence";
import { formatStepCategoryForRuntime } from "../../../../lib/bundle-config/category-runtime";
import { resolveProductPageRenderFilledSlotsAsHorizontalStacked } from "../../../../lib/bundle-config/evidence-template-mapping";
import {
  normalizePricingDisplayOptions,
  serializeBoxSelectionFromPricingDisplayOptions,
} from "../../../../lib/pricing-display-options";
import { syncThemeColors } from "../../../../services/theme-colors.server";
import { buildBundleProductDescriptionHtml } from "../../../../lib/bundle-product-description.server";
import {
  buildBundleProductMediaFileUpdates,
  buildBundleProductPlaceholderMediaInput,
  hasBundleProductPlaceholderMedia,
  type BundleProductMediaNode,
} from "../../../../lib/bundle-product-media.server";
import { buildGeneratedBundleProductMetadata } from "../../../../lib/bundle-product-data.server";
import { publishProductToSalesChannels } from "../../../../services/shopify-publications.server";
import {
  deriveCommonSellingPlanGroups,
  extractSellingPlanValidationSources,
  SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE,
} from "../../../../lib/bundle-config/product-page-admin-sections";

// Re-export shared handlers so the barrel (index.ts) still works
export {
  safeJsonParse,
  handleUpdateBundleStatus,
  handleUpdateBundleProduct,
  handleGetPages,
  handleGetThemeTemplates,
  handleGetCurrentTheme,
  handleEnsureBundleTemplates,
};

// ─── Private helpers ──────────────────────────────────────────────────────────

type ProductSyncResult = {
  handle?: string | null;
};

type ProductSyncOptions = {
  shopName?: string | null;
  mediaNodes?: BundleProductMediaNode[];
  skipMediaSync?: boolean;
};

async function loadShopName(admin: ShopifyAdmin): Promise<string | null> {
  const GET_SHOP_NAME = `
    query GetShopName {
      shop {
        name
      }
    }
  `;

  const response = await admin.graphql(GET_SHOP_NAME);
  const data = await response.json() as { data?: { shop?: { name?: string | null } }; errors?: unknown[] };

  if (data.errors?.length) {
    AppLogger.warn("[PRODUCT_SYNC] Failed to fetch shop name for generated product vendor:", {
      component: "app.bundles.product-page.configure",
    }, data.errors);
    return null;
  }

  return data.data?.shop?.name?.trim() || null;
}

async function loadBundleProductMediaNodes(
  admin: ShopifyAdmin,
  productId: string,
): Promise<BundleProductMediaNode[]> {
  const GET_BUNDLE_PRODUCT_MEDIA = `
    query GetBundleProductMedia($id: ID!) {
      product(id: $id) {
        id
        media(first: 10) {
          nodes {
            ... on MediaImage {
              id
              alt
              image {
                url
                altText
              }
            }
          }
        }
      }
    }
  `;

  const response = await admin.graphql(GET_BUNDLE_PRODUCT_MEDIA, {
    variables: { id: productId },
  });
  const data = await response.json() as { data?: { product?: { media?: { nodes?: BundleProductMediaNode[] } } }; errors?: unknown[] };
  if (data.errors?.length) {
    AppLogger.warn("[PRODUCT_SYNC] Failed to fetch generated product media:", {
      component: "app.bundles.product-page.configure",
      productId,
    }, data.errors);
    return [];
  }

  return data.data?.product?.media?.nodes || [];
}

async function addBundleProductPlaceholderMedia(
  admin: ShopifyAdmin,
  productId: string,
  bundleName: string,
): Promise<BundleProductMediaNode[]> {
  const mediaInput = buildBundleProductPlaceholderMediaInput(process.env.SHOPIFY_APP_URL, bundleName);
  if (!mediaInput) {
    return [];
  }

  const UPDATE_BUNDLE_PRODUCT_MEDIA = `
    mutation AddBundleProductMedia($product: ProductUpdateInput!, $media: [CreateMediaInput!]) {
      productUpdate(product: $product, media: $media) {
        product {
          id
          media(first: 10) {
            nodes {
              ... on MediaImage {
                id
                alt
                image {
                  url
                  altText
                }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `;

  const response = await admin.graphql(UPDATE_BUNDLE_PRODUCT_MEDIA, {
    variables: {
      product: { id: productId },
      media: mediaInput,
    },
  });
  const data = await response.json() as {
    data?: { productUpdate?: { product?: { media?: { nodes?: BundleProductMediaNode[] } }; userErrors?: Array<{ field?: string[]; message: string }> } };
    errors?: unknown[];
  };
  const userErrors = data.data?.productUpdate?.userErrors || [];

  if (data.errors?.length || userErrors.length > 0) {
    AppLogger.warn("[PRODUCT_SYNC] Failed to add generated product media:", {
      component: "app.bundles.product-page.configure",
      productId,
    }, { errors: data.errors || userErrors });
    return [];
  }

  return data.data?.productUpdate?.product?.media?.nodes || [];
}

async function updateBundleProductMediaFiles(
  admin: ShopifyAdmin,
  files: Array<{ id: string; alt?: string; referencesToRemove?: string[] }>,
): Promise<void> {
  if (files.length === 0) return;

  const UPDATE_BUNDLE_PRODUCT_MEDIA_FILES = `
    mutation UpdateBundleProductMediaFiles($files: [FileUpdateInput!]!) {
      fileUpdate(files: $files) {
        files { id alt }
        userErrors { field message code }
      }
    }
  `;

  const response = await admin.graphql(UPDATE_BUNDLE_PRODUCT_MEDIA_FILES, {
    variables: { files },
  });
  const data = await response.json() as {
    data?: { fileUpdate?: { userErrors?: Array<{ field?: string[]; message: string; code?: string }> } };
    errors?: unknown[];
  };
  const userErrors = data.data?.fileUpdate?.userErrors || [];

  if (data.errors?.length || userErrors.length > 0) {
    AppLogger.warn("[PRODUCT_SYNC] Failed to update generated product media files:", {
      component: "app.bundles.product-page.configure",
      mediaIds: files.map((file) => file.id),
    }, { errors: data.errors || userErrors });
  }
}

async function syncGeneratedBundleProductMedia(
  admin: ShopifyAdmin,
  productId: string,
  bundleName: string,
  knownMediaNodes?: BundleProductMediaNode[],
): Promise<void> {
  try {
    let mediaNodes = knownMediaNodes || await loadBundleProductMediaNodes(admin, productId);
    if (!hasBundleProductPlaceholderMedia(mediaNodes, bundleName)) {
      const updatedMediaNodes = await addBundleProductPlaceholderMedia(admin, productId, bundleName);
      mediaNodes = updatedMediaNodes.length > 0 ? updatedMediaNodes : mediaNodes;
    }

    const fileUpdates = buildBundleProductMediaFileUpdates(productId, mediaNodes, bundleName);
    await updateBundleProductMediaFiles(admin, fileUpdates);
  } catch (error) {
    AppLogger.warn("[PRODUCT_SYNC] Generated product media sync failed:", {
      component: "app.bundles.product-page.configure",
      productId,
    }, error as any);
  }
}

/** Sync bundle product status to Shopify. Non-fatal — logs errors but does not throw. */
async function syncBundleProductToShopify(
  admin: ShopifyAdmin,
  shopifyProductId: string,
  finalStatus: string,
  bundleName: string,
  bundleDescription: string | null,
  bundleId: string,
  options: ProductSyncOptions = {},
): Promise<ProductSyncResult> {
  const shopifyStatus = finalStatus === BundleStatus.UNLISTED ? "ACTIVE" : finalStatus.toUpperCase();
  const descriptionHtml = buildBundleProductDescriptionHtml({
    bundleName,
    customDescription: bundleDescription,
    status: finalStatus,
  });
  const shopName = options.shopName !== undefined ? options.shopName : await loadShopName(admin);
  const productMetadata = buildGeneratedBundleProductMetadata({ bundleName, shopName });
  const syncResult: ProductSyncResult = {};
  AppLogger.debug(`[PRODUCT_SYNC] Syncing status '${shopifyStatus}' to product ${shopifyProductId}`);

  const UPDATE_PRODUCT_STATUS = `
    mutation UpdateProductStatus($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product { id status handle vendor productType }
        userErrors { field message }
      }
    }
  `;

  try {
    const response = await admin.graphql(UPDATE_PRODUCT_STATUS, {
      variables: {
          product: {
            id: shopifyProductId,
            ...productMetadata,
            status: shopifyStatus,
            descriptionHtml,
          },
      },
    });
    const responseData = await response.json() as { data: Record<string, any>; errors?: unknown[] };
    const statusUserErrors = responseData.data?.productUpdate?.userErrors ?? [];

    if (responseData.errors?.length) {
      AppLogger.error("[PRODUCT_SYNC] GraphQL transport error updating product status:", {
        component: "app.bundles.product-page.configure", operation: "sync-product-status", productId: shopifyProductId,
      }, responseData.errors);
    } else if (statusUserErrors.length > 0) {
      AppLogger.error("[PRODUCT_SYNC] Shopify returned errors while updating product status:", {
        component: "app.bundles.product-page.configure", operation: "sync-product-status",
        productId: shopifyProductId, targetStatus: shopifyStatus,
      }, { errors: statusUserErrors });
    } else {
      syncResult.handle = responseData.data?.productUpdate?.product?.handle ?? null;
      AppLogger.info("[PRODUCT_SYNC] Successfully synced product status to Shopify", {
        component: "app.bundles.product-page.configure", productId: shopifyProductId,
        requestedStatus: shopifyStatus, actualStatus: responseData.data?.productUpdate?.product?.status,
      });
    }

    if (finalStatus === BundleStatus.UNLISTED && statusUserErrors.length === 0) {
      const unlistedResponse = await admin.graphql(UPDATE_PRODUCT_STATUS, {
        variables: {
          product: {
            id: shopifyProductId,
            ...productMetadata,
            status: "UNLISTED",
            descriptionHtml,
          },
        },
      });
      const unlistedData = await unlistedResponse.json() as { data: Record<string, any>; errors?: unknown[] };
      const unlistedErrors = unlistedData.data?.productUpdate?.userErrors ?? [];
      if (unlistedErrors.length > 0) {
        AppLogger.warn("[PRODUCT_SYNC] Shopify rejected UNLISTED status:", {
          component: "app.bundles.product-page.configure",
          productId: shopifyProductId,
        }, unlistedErrors);
      } else {
        syncResult.handle = unlistedData.data?.productUpdate?.product?.handle ?? syncResult.handle;
      }
    }

    if (!options.skipMediaSync) {
      await syncGeneratedBundleProductMedia(admin, shopifyProductId, bundleName, options.mediaNodes);
    }
  } catch (error) {
    AppLogger.error("[PRODUCT_SYNC] Failed to sync product status (exception):", {
      component: "app.bundles.product-page.configure", operation: "sync-product-status",
      productId: shopifyProductId, targetStatus: shopifyStatus, bundleId,
    }, error as any);
  }

  return syncResult;
}

function buildRuntimePricingRule(rule: any): Record<string, unknown> {
  const flatRule: Record<string, unknown> = {
    id: rule.id,
    conditionType: rule.conditionType || "quantity",
    conditionValue: Number(rule.conditionValue ?? 0) || 0,
    discountValue: Number(rule.discountValue ?? 0) || 0,
  };

  if (rule.fixedBundlePrice !== undefined) {
    flatRule.fixedBundlePrice = Number(rule.fixedBundlePrice) || 0;
  }
  if (rule.customerBuys !== undefined) {
    flatRule.customerBuys = Number(rule.customerBuys) || 0;
  }
  if (rule.customerGets !== undefined) {
    flatRule.customerGets = Number(rule.customerGets) || 0;
  }
  if (rule.bxyDiscountType !== undefined) {
    flatRule.bxyDiscountType = rule.bxyDiscountType;
  }
  if (rule.bxyApplyMode !== undefined) {
    flatRule.bxyApplyMode = rule.bxyApplyMode;
  }

  return flatRule;
}

/** Build the base bundle configuration object passed to metafield update functions. */
function buildBundleBaseConfig(
  updatedBundle: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    bundleType: string;
    templateName: string | null;
    shopifyProductId: string | null;
    bundleDesignTemplate?: string | null;
    bundleDesignPresetId?: string | null;
    defaultProductsData?: unknown;
    boxSelection?: unknown;
    bundleUpsellConfig?: unknown;
    bundleTextConfig?: unknown;
    discountDisplayOverride?: unknown;
    individualSellingPlanSelection?: unknown;
    validateQuantityPerProduct?: unknown;
    productSlotsEnabled?: boolean | null;
    productSlotIconUrl?: string | null;
    useSingleStepCategoriesAsBundleSteps?: boolean | null;
    pricing?: {
      displayOptions?: unknown;
      messages?: unknown;
    } | null;
  },
  stepsData: any[],
  stepConditionsData: Record<string, any[]>,
  discountData: any,
  bundleParentVariantId: string | null,
): Record<string, unknown> {
  const optimizedSteps = (stepsData || []).map((step: any) => ({
    id: step.id,
    name: step.name || 'Step',
    pageTitle: step.pageTitle ?? null,
    multiLangData: step.multiLangData ?? {},
    stepImage: step.stepImage ?? null,
    minQuantity: parseInt(step.minQuantity) || 1,
    maxQuantity: parseInt(step.maxQuantity) || 1,
    enabled: step.enabled !== false,
    conditionType: stepConditionsData[step.id]?.[0]?.type || null,
    conditionOperator: stepConditionsData[step.id]?.[0]?.operator || null,
    conditionValue: parseConditionValue(stepConditionsData[step.id]?.[0]?.value),
    conditionOperator2: stepConditionsData[step.id]?.[1]?.operator || null,
    conditionValue2: parseConditionValue(stepConditionsData[step.id]?.[1]?.value),
    products: (step.StepProduct || []).map((product: any) => ({
      id: product.id,
      title: product.title || product.name || 'Product',
      imageUrl: product.imageUrl || product.image?.url || null,
    })),
    collections: (step.collections || []).map((collection: any) => ({
      id: collection.id,
      title: collection.title || 'Collection',
    })),
    categories: Array.isArray(step.StepCategory) ? step.StepCategory.map((cat: any) => ({
      name: cat.name || '',
      sortOrder: cat.sortOrder ?? 0,
      products: (cat.products || []).map((p: any) => ({ id: p.id, title: p.title || 'Product', imageUrl: p.imageUrl || null })),
      collections: (cat.collections || []).map((c: any) => ({ id: c.id, title: c.title || 'Collection' })),
    })) : [],
  }));

  const savedPricingMessages = safeJsonParse(updatedBundle.pricing?.messages, {});
  const pricingDisplayOptions = updatedBundle.pricing?.displayOptions
    ?? discountData.displayOptions
    ?? savedPricingMessages.displayOptions
    ?? null;
  const pricingRuleMessages = savedPricingMessages.ruleMessages ?? discountData.ruleMessages ?? {};
  const firstRuleId = discountData.discountRules?.[0]?.id ?? Object.keys(pricingRuleMessages)[0];
  const firstRuleMsg = firstRuleId && pricingRuleMessages?.[firstRuleId];

  const bundleDesignTemplateData = updatedBundle.bundleType === "product_page" && updatedBundle.bundleDesignPresetId
    ? { templateId: updatedBundle.bundleDesignPresetId }
    : null;

  return {
    bundleId: updatedBundle.id,
    id: updatedBundle.id,
    name: updatedBundle.name,
    description: updatedBundle.description,
    status: updatedBundle.status,
    bundleType: updatedBundle.bundleType,
    templateName: updatedBundle.templateName,
    bundleDesignTemplate: updatedBundle.bundleDesignTemplate ?? null,
    bundleDesignPresetId: updatedBundle.bundleDesignPresetId ?? null,
    bundleDesignTemplateData,
    defaultProductsData: updatedBundle.defaultProductsData ?? {},
    boxSelection: updatedBundle.boxSelection ?? null,
    bundleUpsellConfig: updatedBundle.bundleUpsellConfig ?? null,
    bundleTextConfig: updatedBundle.bundleTextConfig ?? null,
    discountDisplayOverride: updatedBundle.discountDisplayOverride ?? null,
    individualSellingPlanSelection: updatedBundle.individualSellingPlanSelection ?? {
      isEnabled: false,
      showFor: "ALL_PRODUCTS",
    },
    validateQuantityPerProduct: updatedBundle.validateQuantityPerProduct ?? {
      isEnabled: false,
      allowedQuantity: 1,
    },
    productSlotsEnabled: updatedBundle.productSlotsEnabled ?? false,
    productSlotIconUrl: updatedBundle.productSlotIconUrl ?? null,
    useSingleStepCategoriesAsBundleSteps: updatedBundle.useSingleStepCategoriesAsBundleSteps ?? false,
    renderFilledSlotsAsHorizontalStacked: resolveProductPageRenderFilledSlotsAsHorizontalStacked(
      updatedBundle.bundleDesignTemplate,
      bundleDesignTemplateData?.templateId,
    ),
    steps: optimizedSteps,
    pricing: {
      enabled: discountData.discountEnabled,
      method: discountData.discountType,
      rules: (discountData.discountRules || []).map(buildRuntimePricingRule),
      display: { showFooter: discountData.showFooter !== false },
      displayOptions: pricingDisplayOptions,
      messages: {
        progress: firstRuleMsg?.discountText || 'Add {conditionText} to get {discountText}',
        qualified: firstRuleMsg?.successMessage || 'Congratulations! You got {discountText}',
        showDiscountMessaging: discountData.discountMessagingEnabled || false,
        showDiscountDisplay: savedPricingMessages.showDiscountDisplay ?? true,
        ruleMessages: pricingRuleMessages,
        successMessage: savedPricingMessages.successMessage ?? discountData.successMessage ?? null,
        successMessageByLocale: savedPricingMessages.successMessageByLocale ?? discountData.successMessageByLocale ?? null,
        displayOptions: pricingDisplayOptions,
        tierTextByRuleId: savedPricingMessages.tierTextByRuleId ?? discountData.tierTextByRuleId ?? null,
        tierTextByLocaleByRuleId: savedPricingMessages.tierTextByLocaleByRuleId ?? discountData.tierTextByLocaleByRuleId ?? null,
        showInCart: true,
      },
    },
    bundleParentVariantId: bundleParentVariantId,
    shopifyProductId: updatedBundle.shopifyProductId,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeSyncVariants(variants: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(variants)) return [];

  return variants
    .filter((variant: any) => typeof variant?.id === "string" && variant.id.trim() !== "")
    .map((variant: any) => {
      const normalized: Record<string, unknown> = { id: variant.id };
      if (variant.title !== undefined) normalized.title = variant.title;
      if (variant.price !== undefined) normalized.price = variant.price;
      if (variant.image !== undefined) normalized.image = variant.image;
      if (variant.availableForSale !== undefined) normalized.availableForSale = variant.availableForSale;
      if (variant.available !== undefined) normalized.availableForSale = variant.available;
      return normalized;
    });
}

function normalizeSyncProduct(product: any): Record<string, unknown> | null {
  if (!product || typeof product !== "object") return null;
  const id = product.productId ?? product.id ?? product.graphqlId;
  if (typeof id !== "string" || id.trim() === "") return null;

  return {
    id,
    title: product.title || product.name || "Product",
    imageUrl: product.imageUrl || product.images?.[0]?.originalSrc || product.images?.[0]?.url || product.image?.url || null,
    variants: normalizeSyncVariants(product.variants),
  };
}

function pushUniqueProduct(target: Array<Record<string, unknown>>, seen: Set<string>, product: any) {
  const normalized = normalizeSyncProduct(product);
  if (!normalized) return;
  const id = normalized.id;
  if (typeof id !== "string" || seen.has(id)) return;
  seen.add(id);
  target.push(normalized);
}

function normalizeSyncCollection(collection: any): Record<string, unknown> | null {
  if (!collection || typeof collection !== "object") return null;
  const id = collection.id ?? collection.collectionId ?? collection.handle;
  if (typeof id !== "string" || id.trim() === "") return null;

  return {
    id,
    title: collection.title || collection.name || "Collection",
    handle: collection.handle ?? null,
  };
}

function pushUniqueCollection(target: Array<Record<string, unknown>>, seen: Set<string>, collection: any) {
  const normalized = normalizeSyncCollection(collection);
  if (!normalized) return;
  const key = typeof normalized.id === "string" ? normalized.id : null;
  if (!key || seen.has(key)) return;
  seen.add(key);
  target.push(normalized);
}

function normalizeSyncCategories(step: any): Array<Record<string, unknown>> {
  return (Array.isArray(step.StepCategory) ? step.StepCategory : []).map((category: any, index: number) => {
    const formatted = formatStepCategoryForRuntime(category, index);
    return {
      ...formatted,
      products: Array.isArray(category.products)
        ? category.products.map(normalizeSyncProduct).filter(Boolean)
        : [],
      collections: Array.isArray(formatted.collections)
        ? formatted.collections.map(normalizeSyncCollection).filter(Boolean)
        : [],
    };
  });
}

function buildSyncOptimizedSteps(steps: any[]): Array<Record<string, unknown>> {
  return (steps || []).map((step: any) => {
    const products: Array<Record<string, unknown>> = [];
    const collections: Array<Record<string, unknown>> = [];
    const seenProductIds = new Set<string>();
    const seenCollectionIds = new Set<string>();

    for (const product of Array.isArray(step.StepProduct) ? step.StepProduct : []) {
      pushUniqueProduct(products, seenProductIds, product);
    }
    for (const product of Array.isArray(step.products) ? step.products : []) {
      pushUniqueProduct(products, seenProductIds, product);
    }
    for (const collection of Array.isArray(step.collections) ? step.collections : []) {
      pushUniqueCollection(collections, seenCollectionIds, collection);
    }

    const categories = normalizeSyncCategories(step);

    return {
      id: step.id,
      name: step.name,
      position: step.position,
      stepImage: step.timelineIconUrl ?? null,
      minQuantity: step.minQuantity || 1,
      maxQuantity: step.maxQuantity || 1,
      enabled: step.enabled !== false,
      conditionType: step.conditionType,
      conditionOperator: step.conditionOperator,
      conditionValue: step.conditionValue,
      conditionOperator2: step.conditionOperator2,
      conditionValue2: step.conditionValue2,
      products,
      collections,
      StepProduct: Array.isArray(step.StepProduct) ? step.StepProduct : [],
      StepCategory: categories,
    };
  });
}

function buildSyncPricingConfig(pricing: any): Record<string, unknown> | null {
  if (!pricing) return null;

  const syncMsgs = safeJsonParse(pricing.messages, {});
  const syncRuleMessages = syncMsgs.ruleMessages || {};
  const syncFirstRuleId = Object.keys(syncRuleMessages)[0];
  const syncFirstRuleMsg = syncFirstRuleId ? syncRuleMessages[syncFirstRuleId] : null;

  return {
    enabled: pricing.enabled,
    method: pricing.method,
    rules: safeJsonParse(pricing.rules, []).map((rule: any) => {
      const flat: Record<string, unknown> = {
        id: rule.id,
        conditionType: rule.conditionType || rule.type || "quantity",
        conditionValue: parseFloat(rule.conditionValue ?? rule.value ?? 0) || 0,
        discountValue: parseFloat(rule.discountValue ?? rule.discount?.value ?? 0) || 0,
      };
      if (rule.customerBuys !== undefined) flat.customerBuys = Number(rule.customerBuys);
      if (rule.customerGets !== undefined) flat.customerGets = Number(rule.customerGets);
      if (rule.bxyDiscountType !== undefined) flat.bxyDiscountType = rule.bxyDiscountType;
      if (rule.bxyApplyMode !== undefined) flat.bxyApplyMode = rule.bxyApplyMode;
      return flat;
    }),
    messages: {
      progress: syncFirstRuleMsg?.discountText || "Add {conditionText} to get {discountText}",
      qualified: syncFirstRuleMsg?.successMessage || "Congratulations! You got {discountText}",
      showDiscountMessaging: syncMsgs.showDiscountMessaging || false,
      ruleMessages: syncRuleMessages,
      successMessage: syncMsgs.successMessage ?? null,
      successMessageByLocale: syncMsgs.successMessageByLocale ?? null,
      displayOptions: pricing.displayOptions ?? syncMsgs.displayOptions ?? null,
      tierTextByRuleId: syncMsgs.tierTextByRuleId ?? null,
      tierTextByLocaleByRuleId: syncMsgs.tierTextByLocaleByRuleId ?? null,
    },
    displayOptions: pricing.displayOptions ?? syncMsgs.displayOptions ?? null,
  };
}

function buildSyncBundleConfiguration(
  bundle: any,
  shopifyProductId: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const bundleDesignPresetId = bundle.bundleDesignPresetId ?? null;
  const bundleDesignTemplateData = bundle.bundleType === BundleType.PRODUCT_PAGE && bundleDesignPresetId
    ? { templateId: bundleDesignPresetId }
    : null;

  return {
    bundleId: bundle.id,
    id: bundle.id,
    name: bundle.name,
    description: bundle.description || "",
    status: bundle.status || BundleStatus.ACTIVE,
    templateName: bundle.templateName || null,
    bundleType: bundle.bundleType || BundleType.PRODUCT_PAGE,
    shopifyProductId,
    type: "cart_transform",
    bundleDesignTemplate: bundle.bundleDesignTemplate ?? null,
    bundleDesignPresetId,
    bundleDesignTemplateData,
    defaultProductsData: bundle.defaultProductsData ?? {},
    boxSelection: bundle.boxSelection ?? null,
    bundleUpsellConfig: bundle.bundleUpsellConfig ?? null,
    bundleTextConfig: bundle.bundleTextConfig ?? null,
    personalizationData: bundle.personalizationData ?? null,
    discountDisplayOverride: bundle.discountDisplayOverride ?? null,
    individualSellingPlanSelection: bundle.individualSellingPlanSelection ?? {
      isEnabled: false,
      showFor: "ALL_PRODUCTS",
    },
    validateQuantityPerProduct: bundle.validateQuantityPerProduct ?? {
      isEnabled: false,
      allowedQuantity: 1,
    },
    productSlotsEnabled: bundle.productSlotsEnabled ?? false,
    productSlotIconUrl: bundle.productSlotIconUrl ?? null,
    useSingleStepCategoriesAsBundleSteps: bundle.useSingleStepCategoriesAsBundleSteps ?? false,
    renderFilledSlotsAsHorizontalStacked: resolveProductPageRenderFilledSlotsAsHorizontalStacked(
      bundle.bundleDesignTemplate,
      bundleDesignTemplateData?.templateId,
    ),
    steps: buildSyncOptimizedSteps(bundle.steps || []),
    pricing: buildSyncPricingConfig(bundle.pricing),
    loadingGif: bundle.loadingGif ?? null,
    floatingBadgeEnabled: bundle.floatingBadgeEnabled ?? false,
    floatingBadgeText: bundle.floatingBadgeText ?? "",
    textOverrides: bundle.textOverrides ?? null,
    textOverridesByLocale: bundle.textOverridesByLocale ?? null,
    sdkMode: bundle.sdkMode ?? false,
    giftMessagesEnabled: bundle.giftMessagesEnabled ?? false,
    giftMessageProductId: bundle.giftMessageProductId ?? null,
    giftMessageProductTitle: bundle.giftMessageProductTitle ?? null,
    giftMessageEnableSenderRecipient: bundle.giftMessageEnableSenderRecipient ?? false,
    giftMessageMandatory: bundle.giftMessageMandatory ?? false,
    giftMessageEnableLimit: bundle.giftMessageEnableLimit ?? false,
    giftMessageCharLimit: bundle.giftMessageCharLimit ?? null,
    giftMessageSendEmail: bundle.giftMessageSendEmail ?? false,
    updatedAt: new Date().toISOString(),
    ...extra,
  };
}

async function updateSyncMetafields(
  admin: ShopifyAdmin,
  productId: string,
  bundle: any,
  extra: Record<string, unknown> = {},
) {
  const bundleConfiguration = buildSyncBundleConfiguration(bundle, productId, extra);
  const configSize = JSON.stringify(bundleConfiguration).length;
  AppLogger.debug("[METAFIELD] Sync optimized configuration size:", {}, `${configSize} chars`);

  const [componentResult, variantResult] = await Promise.allSettled([
    updateComponentProductMetafields(admin, productId, bundleConfiguration),
    updateBundleProductMetafields(admin, productId, bundleConfiguration),
  ]);

  if (componentResult.status === "rejected") {
    throw new Error(`Failed to update component metafields: ${componentResult.reason}`);
  }
  if (variantResult.status === "rejected") {
    throw new Error(`Failed to update bundle variant metafields: ${variantResult.reason}`);
  }

  return bundleConfiguration;
}

// ─────────────────────────────────────────────────────────────────────────────

async function fetchProductsWithSellingPlanGroups(admin: ShopifyAdmin, productIds: string[]) {
  const products: Array<{
    id: string;
    title: string;
    sellingPlanGroups: { nodes: Array<{ id: string; name: string }> };
  }> = [];

  const query = `
    query ProductsWithSellingPlanGroups($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          title
          sellingPlanGroups(first: 50) {
            nodes {
              id
              name
            }
          }
        }
      }
    }
  `;

  for (let index = 0; index < productIds.length; index += 50) {
    const ids = productIds.slice(index, index + 50);
    const response = await admin.graphql(query, { variables: { ids } });
    const data = await response.json() as {
      data?: {
        nodes?: Array<{
          id?: string;
          title?: string;
          sellingPlanGroups?: { nodes?: Array<{ id?: string; name?: string }> };
        } | null>;
      };
    };

    for (const product of data.data?.nodes ?? []) {
      if (!product?.id) continue;
      products.push({
        id: product.id,
        title: product.title ?? "",
        sellingPlanGroups: {
          nodes: (product.sellingPlanGroups?.nodes ?? [])
            .filter((group): group is { id: string; name: string } => (
              typeof group?.id === "string" && typeof group?.name === "string"
            )),
        },
      });
    }
  }

  return products;
}

async function fetchCollectionProductIds(admin: ShopifyAdmin, collectionIds: string[]) {
  const products: string[] = [];
  const seen = new Set<string>();

  const query = `
    query CollectionProductsForSellingPlanValidation($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Collection {
          products(first: 250) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  `;

  for (let index = 0; index < collectionIds.length; index += 50) {
    const ids = collectionIds.slice(index, index + 50);
    const response = await admin.graphql(query, { variables: { ids } });
    const data = await response.json() as {
      data?: {
        nodes?: Array<{
          id?: string;
          products?: {
            edges?: Array<{ node?: { id?: string } }>;
          };
        }>;
      };
    };

    for (const collection of data.data?.nodes ?? []) {
      if (!collection) continue;
      const edges = collection?.products?.edges ?? [];
      for (const edge of edges) {
        const productId = edge.node?.id;
        if (typeof productId !== "string" || productId.trim() === "") continue;
        if (seen.has(productId)) continue;
        seen.add(productId);
        products.push(productId);
      }
    }
  }

  return products;
}

/**
 * Validate that all product-page bundle products share at least one selling plan group.
 */
export async function handleValidateSellingPlanGroups(admin: ShopifyAdmin, session: Session, bundleId: string) {
  const bundle = await db.bundle.findFirst({
    where: {
      id: bundleId,
      shopId: session.shop,
      bundleType: BundleType.PRODUCT_PAGE,
    },
    include: {
      steps: {
        include: {
          StepProduct: true,
          StepCategory: true,
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!bundle) {
    return json({ success: false, error: ERROR_MESSAGES.BUNDLE_NOT_FOUND }, { status: 404 });
  }

  const sources = extractSellingPlanValidationSources(bundle);
  const collectionProductIds = await fetchCollectionProductIds(admin, sources.collectionIds);
  const allProductIds = Array.from(new Set([...sources.productIds, ...collectionProductIds]));
  if (allProductIds.length === 0) {
    return json({
      success: true,
      isValid: false,
      productCount: 0,
      plans: [],
      message: SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE,
    });
  }

  const productIds = allProductIds;
  const products = await fetchProductsWithSellingPlanGroups(admin, productIds);
  const plans = deriveCommonSellingPlanGroups(products);
  const isValid = productIds.length > 0 && products.length === productIds.length && plans.length > 0;

  return json({
    success: true,
    isValid,
    productCount: products.length,
    plans,
    message: isValid ? null : SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE,
  });
}

/**
 * Handle saving bundle configuration
 */
export async function handleSaveBundle(admin: ShopifyAdmin, session: Session, bundleId: string, formData: FormData) {
  const endTimer = AppLogger.startTimer('Bundle save process', {
    component: 'bundle-config',
    operation: 'save',
    bundleId,
    shopId: session.shop
  });

  AppLogger.info('Starting enhanced bundle save process', {
    component: 'bundle-config',
    operation: 'save',
    bundleId,
    shopId: session.shop
  });

  try {

    // Parse form data
    const bundleName = formData.get("bundleName") as string;
    const bundleDescription = formData.get("bundleDescription") as string;
    const bundleStatus = formData.get("bundleStatus") as string;
    const templateName = formData.get("templateName") as string || null;
    if (!Object.values(BundleStatus).includes(bundleStatus as BundleStatus)) {
      return json(
        { success: false, error: "Invalid bundle status" },
        { status: 400 }
      );
    }

    const loadingGifRaw = formData.get("loadingGif") as string;
    const loadingGif = loadingGifRaw || null;
    const showProductPrices = formData.get("showProductPrices") !== "false";
    const showCompareAtPrices = formData.get("showCompareAtPrices") === "true";
    const cartRedirectToCheckout = formData.get("cartRedirectToCheckout") === "true";
    const allowQuantityChanges = formData.get("allowQuantityChanges") !== "false";
    const sdkMode = formData.get("sdkMode") === "true";
    const textOverridesRaw = formData.get("textOverrides") as string | null;
    const textOverridesByLocaleRaw = formData.get("textOverridesByLocale") as string | null;
    const textOverrides = textOverridesRaw ? JSON.parse(textOverridesRaw) : null;
    const textOverridesByLocale = textOverridesByLocaleRaw ? JSON.parse(textOverridesByLocaleRaw) : null;
    const stepsData = JSON.parse(formData.get("stepsData") as string);
    const discountData = JSON.parse(formData.get("discountData") as string);
    const stepConditionsData = formData.get("stepConditions") ? JSON.parse(formData.get("stepConditions") as string) : {};
    const bundleProductData = formData.get("bundleProduct") ? JSON.parse(formData.get("bundleProduct") as string) : null;

    AppLogger.debug("Parsed form data:", {
      bundleName,
      bundleDescription,
      bundleStatus,
      stepsCount: stepsData.length,
      discountEnabled: discountData.discountEnabled,
      discountType: discountData.discountType,
      hasConditions: Object.keys(stepConditionsData).length > 0,
      hasBundleProduct: !!bundleProductData
    });

    AppLogger.debug("[DEBUG] Step Conditions Data from form:", stepConditionsData);
    AppLogger.debug("[DEBUG] Bundle Product Data from form:", bundleProductData);

    // DEBUG: Log all product IDs being submitted
    AppLogger.debug("[DEBUG] Steps data received from form:");
    stepsData.forEach((step: any, idx: number) => {
      AppLogger.debug(`  Step ${idx + 1}: "${step.name}" (step.id: ${step.id})`);
      if (step.StepProduct && Array.isArray(step.StepProduct)) {
        step.StepProduct.forEach((product: any, pidx: number) => {
          AppLogger.debug(`    Product ${pidx + 1}: "${product.title}" → product.id: ${product.id}`);
        });
      }
    });

    // VALIDATION + NORMALISATION: Validate and normalise all product IDs in one pass at the boundary.
    // normaliseShopifyProductId rejects UUIDs (corrupted browser state) and converts numeric IDs to GIDs.
    // IDs are mutated in place so the Prisma .map() below can use product.id directly.
    for (const step of stepsData) {
      if (!step.StepProduct || !Array.isArray(step.StepProduct)) continue;
      for (const product of step.StepProduct) {
        product.id = normaliseShopifyProductId(product.id, {
          title: product.title || product.name || "unknown",
          stepName: step.name,
        });
      }
    }

    AppLogger.debug("[VALIDATION] All product IDs are valid Shopify GIDs");

    // FIXED_BUNDLE_PRICE: Store the fixed price directly (NO conversion)
    // The cart transform will calculate the percentage dynamically based on actual cart total
    if (discountData.discountEnabled && discountData.discountType === 'fixed_bundle_price') {
      AppLogger.debug("[FIXED_BUNDLE_PRICE] Storing fixed bundle price (will be converted at runtime)");

      // For fixed_bundle_price, keep the original price value in a special field
      // The cart transform will read this and calculate discount based on actual cart total
      const processedRules = (discountData.discountRules || []).map((rule: any) => {
        const fixedPrice = parseFloat(rule.price || 0);
        AppLogger.debug(`[FIXED_BUNDLE_PRICE] Rule fixed price: ${fixedPrice}`);

        // Store the fixed price in a dedicated field for runtime calculation
        return {
          ...rule,
          fixedBundlePrice: fixedPrice,  // The target bundle price
          // Don't set discountValue here - it will be calculated at runtime
        };
      });

      discountData.discountRules = processedRules;
      AppLogger.debug("[FIXED_BUNDLE_PRICE] Stored fixed price for runtime calculation:", processedRules);
    }

    const normalizedPricingDisplayOptions = normalizePricingDisplayOptions({
      rules: discountData.discountRules || [],
      messages: { displayOptions: discountData.displayOptions || null },
      showProgressBar: discountData.displayOptions?.progressBar?.enabled === true,
      method: discountData.discountType,
    });
    const productSlotsEnabled = formData.get("productSlotsEnabled") === "true";
    const parsedBundleSettings = parsePPBBundleSettings(formData);
    const quantityValidationEnabled = parsedBundleSettings.validateQuantityPerProduct?.isEnabled === true;
    const directBoxSelection = discountData.discountEnabled === true
      && discountData.discountType !== "buy_x_get_y"
      ? serializeBoxSelectionFromPricingDisplayOptions(normalizedPricingDisplayOptions)
      : null;
    const boxSelection = directBoxSelection
      ? {
          ...directBoxSelection,
          validateBoxSelectionQuantity: quantityValidationEnabled,
        }
      : null;
    const pricingMessages = {
      showDiscountDisplay: true,
      showDiscountMessaging: discountData.discountMessagingEnabled || false,
      ruleMessages: discountData.ruleMessages || {},
      successMessage: discountData.successMessage ?? null,
      successMessageByLocale: discountData.successMessageByLocale ?? null,
      displayOptions: discountData.displayOptions ?? null,
      tierTextByRuleId: discountData.tierTextByRuleId ?? null,
      tierTextByLocaleByRuleId: discountData.tierTextByLocaleByRuleId ?? null,
    };

    // Automatically set status to 'active' if bundle has configured steps
    let finalStatus = bundleStatus as any;
    if (bundleStatus === BundleStatus.DRAFT && stepsData && stepsData.length > 0) {
      const hasConfiguredSteps = stepsData.some((step: any) =>
        (step.StepProduct && step.StepProduct.length > 0) ||
        (step.collections && step.collections.length > 0) ||
        (Array.isArray(step.StepCategory) && step.StepCategory.some((cat: any) =>
          (cat.products && cat.products.length > 0) || (cat.collections && cat.collections.length > 0)
        ))
      );
      AppLogger.debug("[BUNDLE_CONFIG] Status evaluation:", {
        originalStatus: bundleStatus,
        hasConfiguredSteps,
        stepsCount: stepsData.length
      });
      if (hasConfiguredSteps) {
        finalStatus = BundleStatus.ACTIVE;
        AppLogger.debug("[BUNDLE_CONFIG] Auto-activating bundle with configured steps");
      }
    }

    // Get existing bundle to preserve shopifyProductId/Handle if not provided
    const existingBundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      select: { shopifyProductId: true, shopifyProductHandle: true }
    });

    // Update bundle in database
    AppLogger.debug("[BUNDLE_CONFIG] Updating bundle in database");
    const updatedBundle = await db.bundle.update({
      where: {
        id: bundleId,
        shopId: session.shop
      },
      data: {
        name: bundleName,
        description: bundleDescription,
        status: finalStatus,
        // Preserve existing shopifyProductId/Handle if not provided in form
        shopifyProductId: bundleProductData?.id || existingBundle?.shopifyProductId || null,
        shopifyProductHandle: bundleProductData?.handle || existingBundle?.shopifyProductHandle || null,
        templateName: templateName,
        loadingGif: loadingGif,
        showProductPrices,
        showCompareAtPrices,
        cartRedirectToCheckout,
        allowQuantityChanges,
        sdkMode,
        textOverrides,
        textOverridesByLocale,
        ...parsePPBGiftMessages(formData),
        ...parsePPBBundleVisibility(formData),
        ...parsedBundleSettings,
        boxSelection,
        // Update steps if provided
        ...(stepsData && {
          steps: {
            deleteMany: {},
            create: stepsData.map((step: any, index: number) => {
              // Get conditions for this step from stepConditionsData
              const stepConditions = stepConditionsData[step.id] || [];
              const firstCondition = stepConditions.length > 0 ? stepConditions[0] : null;
              const secondCondition = stepConditions.length > 1 ? stepConditions[1] : null;
              AppLogger.debug(`[DEBUG] Step ${step.id} conditions:`, stepConditions);
              AppLogger.debug(`[DEBUG] Step ${step.id} first condition:`, firstCondition);
              AppLogger.debug(`[DEBUG] Will save to DB - conditionType: ${firstCondition?.type || null}, conditionOperator: ${firstCondition?.operator || null}, conditionValue: ${firstCondition?.value ? parseInt(firstCondition.value) || null : null}`);

              return {
                name: step.name,
                pageTitle: step.pageTitle ?? null,
                multiLangData: step.multiLangData ?? null,
                position: index + 1, // Map stepNumber to position field
                products: step.products || [],
                collections: step.collections || [],
                displayVariantsAsIndividual: step.displayVariantsAsIndividualProducts || false,
                minQuantity: parseInt(step.minQuantity) || 1,
                maxQuantity: parseInt(step.maxQuantity) || 1,
                enabled: step.enabled !== false, // Default to true unless explicitly false
                // Free gift / add-on step fields
                isFreeGift: step.isFreeGift === true,
                freeGiftName: step.freeGiftName || null,
                addonLabel: step.addonLabel ?? null,
                addonTitle: step.addonTitle ?? null,
                addonAddText: step.addonAddText ?? null,
                addonReplaceText: step.addonReplaceText ?? null,
                addonIconUrl: step.addonIconUrl ?? null,
                addonDisplayFree: step.addonDisplayFree === true,
                addonUnlockAfterCompletion: step.addonUnlockAfterCompletion !== false,
                isDefault: step.isDefault === true,
                defaultVariantId: step.defaultVariantId || null,
                // Apply condition data if available
                conditionType: firstCondition?.type || null,
                conditionOperator: firstCondition?.operator || null,
                conditionValue: parseConditionValue(firstCondition?.value),
                conditionOperator2: secondCondition?.operator || null,
                conditionValue2: parseConditionValue(secondCondition?.value),
                filters: Array.isArray(step.filters) ? step.filters : null,
                imageUrl: step.imageUrl ?? null,
                bannerImageUrl: step.bannerImageUrl ?? null,
                timelineIconUrl: step.stepImage ?? null,
                // Create StepProduct records for selected products
                StepProduct: {
                  create: (step.StepProduct || []).map((product: any, productIndex: number) => {
                    // IDs already validated and normalised at the boundary above
                    return {
                      productId: product.id,
                      title: product.title || product.name || 'Unnamed Product',
                      imageUrl: product.imageUrl || product.images?.[0]?.originalSrc || product.images?.[0]?.url || product.image?.url || null,
                      variants: product.variants || null,
                      minQuantity: parseInt(product.minQuantity) || 1,
                      maxQuantity: parseInt(product.maxQuantity) || 10,
                      position: productIndex + 1
                    };
                  })
                },
                // Create StepCategory records for merchant-defined categories
                StepCategory: {
                  create: Array.isArray(step.StepCategory)
                    ? step.StepCategory.map((cat: Record<string, unknown>, catIndex: number) => buildStepCategoryCreateInput(cat, catIndex))
                    : []
                }
              };
            })
          }
        }),
        // Update pricing if provided
        ...(discountData && {
          pricing: {
            upsert: {
              create: {
                enabled: discountData.discountEnabled,
                method: mapDiscountMethod(discountData.discountType),
                rules: discountData.discountRules || [],
                showFooter: discountData.showFooter !== false,
                displayOptions: discountData.displayOptions ?? null,
                messages: pricingMessages,
                ruleMessagesByLocale: discountData.ruleMessagesByLocale ?? null,
              },
              update: {
                enabled: discountData.discountEnabled,
                method: mapDiscountMethod(discountData.discountType),
                rules: discountData.discountRules || [],
                showFooter: discountData.showFooter !== false,
                displayOptions: discountData.displayOptions ?? null,
                messages: pricingMessages,
                ruleMessagesByLocale: discountData.ruleMessagesByLocale ?? null,
              }
            }
          }
        })
      },
      include: {
        steps: {
          include: {
            StepProduct: true,
            StepCategory: { orderBy: { sortOrder: "asc" } }
          }
        },
        pricing: true
      }
    });

    // If bundle has a Shopify product, update its metafields (needed for cart transform even without discounts)
    if (updatedBundle.shopifyProductId) {
      // Sync product status to Shopify
      const productSyncResult = await syncBundleProductToShopify(
        admin,
        updatedBundle.shopifyProductId,
        finalStatus,
        updatedBundle.name,
        updatedBundle.description,
        bundleId,
      );
      if (productSyncResult.handle && productSyncResult.handle !== updatedBundle.shopifyProductHandle) {
        await db.bundle.update({
          where: { id: bundleId },
          data: { shopifyProductHandle: productSyncResult.handle },
        });
        updatedBundle.shopifyProductHandle = productSyncResult.handle;
      }

      // Get the bundle product's first variant ID for cart transform merge operations
      const bundleParentVariantId = await getBundleProductVariantId(admin, updatedBundle.shopifyProductId);
      AppLogger.debug(`[BUNDLE_CONFIG] Bundle parent variant ID: ${bundleParentVariantId}`);

      const baseConfiguration = buildBundleBaseConfig(
        updatedBundle, stepsData, stepConditionsData, discountData, bundleParentVariantId
      );

      const configSize = JSON.stringify(baseConfiguration).length;
      AppLogger.debug("[METAFIELD] Optimized configuration size:", {}, `${configSize} chars`);

      // VALIDATION: Check bundle has steps and products BEFORE attempting metafield updates
      // This validation must fail the save operation if not met
      const fullBundleConfig = {
        ...baseConfiguration,
        steps: updatedBundle.steps.map((step: any) => {
          const { timelineIconUrl, ...publicStep } = step;
          return {
            ...publicStep,
            stepImage: timelineIconUrl ?? null,
          };
        })
      };

      if (!fullBundleConfig.steps || fullBundleConfig.steps.length === 0) {
        AppLogger.error("[VALIDATION] Cannot save bundle: No steps defined");
        throw new Error("Please add at least one step to your bundle before saving");
      }

      // Validate at least one step has products (or collections that resolve to products)
      const hasProducts = fullBundleConfig.steps.some((step: any) =>
        (step.StepProduct && step.StepProduct.length > 0) ||
        (step.products && step.products.length > 0) ||
        (Array.isArray(step.collections) && step.collections.length > 0) ||
        (Array.isArray(step.StepCategory) && step.StepCategory.some((cat: any) =>
          (Array.isArray(cat.products) && cat.products.length > 0) ||
          (Array.isArray(cat.collections) && cat.collections.length > 0)
        ))
      );

      if (!hasProducts) {
        AppLogger.error("[VALIDATION] Cannot save bundle: No products found in any step");
        throw new Error("Please add products to at least one step before saving");
      }

      // Ensure shopifyProductId exists for metafield updates
      if (!updatedBundle.shopifyProductId) {
        AppLogger.error("[VALIDATION] Cannot update metafields: No Shopify product ID");
        throw new Error("Bundle must have a Shopify product ID to update metafields");
      }

      // Extract shopifyProductId to a const for TypeScript type narrowing
      const shopifyProductId = updatedBundle.shopifyProductId;

      // Parallelize independent metafield updates for better performance
      AppLogger.debug("[METAFIELDS] Updating all metafields in parallel");
      const [standardResult, componentResult, variantResult] = await Promise.allSettled([
        // STANDARD METAFIELDS: For Shopify cart transform compatibility (non-critical)
        (async () => {
          AppLogger.debug("[STANDARD_METAFIELD] Updating standard Shopify metafields for bundle product");
          const { metafields: standardMetafields, errors: conversionErrors } = await convertBundleToStandardMetafields(admin, baseConfiguration);
          if (conversionErrors.length > 0) {
            AppLogger.warn("[STANDARD_METAFIELD] Some products could not be processed:", conversionErrors);
          }
          if (Object.keys(standardMetafields).length > 0) {
            await updateProductStandardMetafields(admin, shopifyProductId, standardMetafields);
            AppLogger.debug("[STANDARD_METAFIELD] Standard metafields updated successfully");
          } else {
            AppLogger.debug("[STANDARD_METAFIELD] No standard metafields to update");
          }
        })(),
        // COMPONENT METAFIELDS: CRITICAL for cart transform MERGE operation
        updateComponentProductMetafields(admin, shopifyProductId, fullBundleConfig),
        // BUNDLE VARIANT METAFIELDS: CRITICAL — without this, the widget cannot load on the storefront
        updateBundleProductMetafields(admin, shopifyProductId, fullBundleConfig),
      ]);

      // Standard metafields: non-critical, warn only
      if (standardResult.status === "rejected") {
        AppLogger.warn("[STANDARD_METAFIELD] Standard metafields update failed (non-critical):", {
          component: "handlers.server",
          shopifyProductId,
        }, standardResult.reason);
      }
      // Component metafields: CRITICAL for cart transform — propagate failure
      if (componentResult.status === "rejected") {
        throw new Error(`Failed to update component metafields (cart transform will break): ${componentResult.reason}`);
      }
      // Bundle variant metafields: CRITICAL for widget load — propagate failure
      if (variantResult.status === "rejected") {
        throw new Error(`Failed to update bundle variant metafields (widget will not load): ${variantResult.reason}`);
      }

      AppLogger.debug("[METAFIELDS] All metafields updated successfully");
    }

    return json({
      success: true,
      bundle: updatedBundle,
      message: "Bundle configuration saved successfully"
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.FAILED_TO_SAVE_CONFIGURATION;
    AppLogger.error("[BUNDLE_CONFIG] Error saving bundle:", { component: "handlers.server", bundleId }, error);
    return json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * Handle syncing bundle product
 */
export async function handleSyncProduct(admin: ShopifyAdmin, session: Session, bundleId: string, _formData: FormData) {
  const bundle = await db.bundle.findUnique({
    where: {
      id: bundleId,
      shopId: session.shop
    },
    include: {
      steps: {
        include: {
          StepProduct: { orderBy: { position: "asc" } },
          StepCategory: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { position: "asc" },
      },
      pricing: true
    }
  });

  if (!bundle) {
    return json({ success: false, error: ERROR_MESSAGES.BUNDLE_NOT_FOUND }, { status: 404 });
  }

  let productId = bundle.shopifyProductId;

  // If product exists, fetch latest data from Shopify and sync to database
  if (productId) {
    try {
      const GET_PRODUCT_FOR_SYNC = `
        query GetBundleProductForSync($id: ID!) {
          product(id: $id) {
            id
            title
            description
            descriptionHtml
            handle
            status
            productType
            vendor
            tags
            onlineStoreUrl
            featuredMedia {
              ... on MediaImage {
                id
                image {
                  url
                  altText
                }
              }
            }
            media(first: 10) {
              nodes {
                ... on MediaImage {
                  id
                  alt
                  image {
                    url
                    altText
                  }
                }
              }
            }
            variants(first: 1) {
              nodes {
                id
                price
                compareAtPrice
                sku
                inventoryQuantity
              }
            }
            updatedAt
            createdAt
          }
        }
      `;

      const response = await admin.graphql(GET_PRODUCT_FOR_SYNC, {
        variables: { id: productId }
      });

      const data = await response.json() as { data: Record<string, any>; errors?: Array<{ message: string }> };

      if (data.errors) {
        AppLogger.error("GraphQL errors:", {}, data.errors);
        return json({
          success: false,
          error: `Failed to fetch product: ${data.errors[0].message}`
        }, { status: 400 });
      }

      const shopifyProduct = data.data?.product;

      if (!shopifyProduct) {
        // Product no longer exists in Shopify, remove reference from bundle
        await db.bundle.update({
          where: { id: bundleId },
          data: { shopifyProductId: null }
        });

        return json({
          success: false,
          error: "Product no longer exists in Shopify. Bundle product reference has been cleared."
        }, { status: 404 });
      }

      // Check if bundle name has changed and optionally sync it
      let bundleNeedsSyncing = false;
      const updatedBundle: any = {};

      // Sync bundle description if changed in Shopify
      if (shopifyProduct.description !== bundle.description) {
        updatedBundle.description = shopifyProduct.description;
        bundleNeedsSyncing = true;
      }

      // Update bundle with synced data if needed
      if (bundleNeedsSyncing) {
        await db.bundle.update({
          where: { id: bundleId },
          data: updatedBundle
        });
      }

      const productSyncResult = await syncBundleProductToShopify(
        admin,
        productId,
        bundle.status,
        bundle.name,
        bundle.description,
        bundleId,
        { mediaNodes: shopifyProduct.media?.nodes },
      );
      const syncedProductHandle = productSyncResult.handle || shopifyProduct.handle;
      if (productSyncResult.handle && productSyncResult.handle !== bundle.shopifyProductHandle) {
        await db.bundle.update({
          where: { id: bundleId },
          data: { shopifyProductHandle: productSyncResult.handle },
        });
      }

      // Update metafields with current bundle configuration, even when pricing is off.
      await updateSyncMetafields(admin, productId, bundle, {
        lastSynced: new Date().toISOString(),
        shopifyProduct: {
          id: shopifyProduct.id,
          title: shopifyProduct.title,
          handle: syncedProductHandle,
          updatedAt: shopifyProduct.updatedAt
        }
      });

      return json({
        success: true,
        productId,
        syncedData: {
          title: shopifyProduct.title,
          description: shopifyProduct.description,
          status: shopifyProduct.status,
          lastUpdated: shopifyProduct.updatedAt,
          changesDetected: bundleNeedsSyncing
        },
        message: bundleNeedsSyncing
          ? "Bundle product synchronized successfully. Changes detected and updated."
          : "Bundle product synchronized successfully. No changes detected."
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error";
      AppLogger.error("Sync error:", { component: "handlers.server", bundleId }, error);
      return json({
        success: false,
        error: `Failed to sync product: ${message}`
      }, { status: 500 });
    }
  }

  // Create product if it doesn't exist
  if (!productId) {
    // Calculate proper bundle price based on component products
    AppLogger.debug("[BUNDLE_PRICING] Calculating bundle price for product creation");
    const bundlePrice = await calculateBundlePrice(admin, bundle);

    const CREATE_PRODUCT = `
      mutation CreateBundleProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
        productCreate(product: $product, media: $media) {
          product {
            id
            title
            handle
            status
            productType
            vendor
            media(first: 10) {
              nodes {
                ... on MediaImage {
                  id
                  alt
                  image {
                    url
                    altText
                  }
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const shopName = await loadShopName(admin);
    const productMetadata = buildGeneratedBundleProductMetadata({
      bundleName: bundle.name,
      shopName,
    });
    const mediaInput = buildBundleProductPlaceholderMediaInput(process.env.SHOPIFY_APP_URL, bundle.name);
    const response = await admin.graphql(CREATE_PRODUCT, {
      variables: {
        product: {
          ...productMetadata,
          status: "ACTIVE",
          descriptionHtml: buildBundleProductDescriptionHtml({
            bundleName: bundle.name,
            customDescription: bundle.description,
            status: bundle.status,
          }),
          tags: ["WP-Bundles"]
        },
        ...(mediaInput ? { media: mediaInput } : {}),
      }
    });

    const data = await response.json();

    if (data.data?.productCreate?.userErrors?.length > 0) {
      const error = data.data.productCreate.userErrors[0];
      throw new Error(`Failed to create bundle product: ${error.message}`);
    }

    const createdProduct = data.data?.productCreate?.product;
    productId = createdProduct?.id;
    if (!productId) {
      throw new Error("Created product has no ID");
    }
    const productHandle = createdProduct?.handle || productMetadata.handle;

    // Set price and inventory policy on the auto-created default variant
    // (productVariantUpdate removed in API 2025-10, use productVariantsBulkUpdate)
    const defaultVariantId = data.data?.productCreate?.product?.variants?.edges?.[0]?.node?.id;
    if (defaultVariantId && productId) {
      await admin.graphql(`
        mutation UpdateBundleVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants { id price }
            userErrors { field message }
          }
        }
      `, {
        variables: {
          productId,
          variants: [{
            id: defaultVariantId,
            price: bundlePrice,
            inventoryPolicy: "CONTINUE"
          }]
        }
      });
    }

    // Update bundle with product ID and handle
    await db.bundle.update({
      where: { id: bundleId },
      data: { shopifyProductId: productId, shopifyProductHandle: productHandle }
    });
    await publishProductToSalesChannels(admin, productId, "ppb-sync-product-create");
    const productSyncResult = await syncBundleProductToShopify(
      admin,
      productId,
      bundle.status,
      bundle.name,
      bundle.description,
      bundleId,
      {
        shopName,
        mediaNodes: createdProduct?.media?.nodes,
        skipMediaSync: true,
      },
    );
    if (productSyncResult.handle && productSyncResult.handle !== productHandle) {
      await db.bundle.update({
        where: { id: bundleId },
        data: { shopifyProductHandle: productSyncResult.handle },
      });
    }
  } else {
    // Update existing bundle product price if configuration changed
    try {
      AppLogger.debug("[BUNDLE_PRICING] Updating existing bundle product price");
      const bundlePrice = await calculateBundlePrice(admin, bundle);
      await updateBundleProductPrice(admin, productId, bundlePrice);
    } catch (error) {
      AppLogger.error("[BUNDLE_PRICING] Error updating bundle product price:", {}, error as any);
      // Don't fail the whole operation for pricing update errors
    }
  }

  // Update metafields with current bundle configuration, even when pricing is off.
  if (productId) {
    await updateSyncMetafields(admin, productId, bundle);
  }

  return json({
    success: true,
    productId,
    message: "Bundle product synchronized successfully"
  });
}

/**
 * Handle hard-reset sync of a product-page bundle:
 * Archives and deletes the Shopify product, then re-creates it, and re-runs all metafield
 * operations from the current DB state.
 */
export async function handleSyncBundle(admin: ShopifyAdmin, session: Session, bundleId: string) {
  AppLogger.info('[SYNC_BUNDLE] Starting hard-reset sync for product-page bundle', { bundleId, shopId: session.shop });

  try {
    // 1. Load bundle + steps + pricing from DB
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      include: {
        steps: {
          include: {
            StepProduct: { orderBy: { position: 'asc' } },
            StepCategory: { orderBy: { sortOrder: 'asc' } },
          },
          orderBy: { position: 'asc' },
        },
        pricing: true,
      },
    });

    if (!bundle) {
      return json({ success: false, error: 'Bundle not found' }, { status: 404 });
    }

    if (!bundle.shopifyProductId) {
      return json({
        success: false,
        error: 'Bundle has no Shopify product — save the bundle first to create a product',
      }, { status: 400 });
    }

    const oldProductId = bundle.shopifyProductId;

    // 2. Archive product (Shopify requires ARCHIVED status before deletion)
    const ARCHIVE_PRODUCT = `
      mutation ArchiveProduct($product: ProductUpdateInput!) {
        productUpdate(product: $product) {
          product { id status }
          userErrors { field message }
        }
      }
    `;

    const archiveResponse = await admin.graphql(ARCHIVE_PRODUCT, {
      variables: { product: { id: oldProductId, status: 'ARCHIVED' } },
    });
    const archiveData = await archiveResponse.json();

    if (archiveData.data?.productUpdate?.userErrors?.length > 0) {
      const err = archiveData.data.productUpdate.userErrors[0];
      return json({ success: false, error: `Failed to archive Shopify product: ${err.message}` }, { status: 400 });
    }

    AppLogger.info('[SYNC_BUNDLE] Shopify product archived', { bundleId, productId: oldProductId });

    // 3. Delete Shopify product
    const DELETE_PRODUCT = `
      mutation DeleteProduct($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors { field message }
        }
      }
    `;

    const deleteResponse = await admin.graphql(DELETE_PRODUCT, {
      variables: { input: { id: oldProductId } },
    });
    const deleteData = await deleteResponse.json();

    if (deleteData.data?.productDelete?.userErrors?.length > 0) {
      const err = deleteData.data.productDelete.userErrors[0];
      return json({ success: false, error: `Failed to delete Shopify product: ${err.message}` }, { status: 400 });
    }

    AppLogger.info('[SYNC_BUNDLE] Shopify product deleted', { bundleId, productId: oldProductId });

    // 4. Clear product reference from DB
    await db.bundle.update({
      where: { id: bundleId },
      data: { shopifyProductId: null },
    });

    // 5. Re-create the Shopify product
    const bundlePrice = await calculateBundlePrice(admin, bundle);

    const CREATE_PRODUCT = `
      mutation CreateBundleProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
        productCreate(product: $product, media: $media) {
          product {
            id title handle status productType vendor
            media(first: 10) {
              nodes {
                ... on MediaImage {
                  id
                  alt
                  image {
                    url
                    altText
                  }
                }
              }
            }
            variants(first: 1) { edges { node { id } } }
          }
          userErrors { field message }
        }
      }
    `;

    const shopName = await loadShopName(admin);
    const productMetadata = buildGeneratedBundleProductMetadata({
      bundleName: bundle.name,
      shopName,
    });
    const mediaInput = buildBundleProductPlaceholderMediaInput(process.env.SHOPIFY_APP_URL, bundle.name);
    const createResponse = await admin.graphql(CREATE_PRODUCT, {
      variables: {
        product: {
          ...productMetadata,
          status: 'ACTIVE',
          descriptionHtml: buildBundleProductDescriptionHtml({
            bundleName: bundle.name,
            customDescription: bundle.description,
            status: bundle.status,
          }),
          tags: ['WP-Bundles'],
        },
        ...(mediaInput ? { media: mediaInput } : {}),
      },
    });

    const createData = await createResponse.json();

    if (createData.data?.productCreate?.userErrors?.length > 0) {
      const err = createData.data.productCreate.userErrors[0];
      throw new Error(`Failed to re-create Shopify product: ${err.message}`);
    }

    const createdProduct = createData.data?.productCreate?.product;
    const newProductId = createdProduct?.id;
    const productHandle = createdProduct?.handle || productMetadata.handle;

    // Set price and inventory policy on the auto-created default variant
    // (productVariantUpdate removed in API 2025-10, use productVariantsBulkUpdate)
    const defaultVariantId = createData.data?.productCreate?.product?.variants?.edges?.[0]?.node?.id;
    if (defaultVariantId && newProductId) {
      await admin.graphql(`
        mutation UpdateBundleVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants { id price }
            userErrors { field message }
          }
        }
      `, {
        variables: {
          productId: newProductId,
          variants: [{
            id: defaultVariantId,
            price: bundlePrice,
            inventoryPolicy: 'CONTINUE'
          }]
        }
      });
    }
    if (!newProductId) {
      throw new Error('Re-created product has no ID');
    }

    AppLogger.info('[SYNC_BUNDLE] Shopify product re-created', { bundleId, newProductId });

    // 6. Update DB with new product ID and handle
    await db.bundle.update({
      where: { id: bundleId },
      data: { shopifyProductId: newProductId, shopifyProductHandle: productHandle },
    });
    await publishProductToSalesChannels(admin, newProductId, "ppb-sync-bundle-recreate");
    const productSyncResult = await syncBundleProductToShopify(
      admin,
      newProductId,
      bundle.status,
      bundle.name,
      bundle.description,
      bundleId,
      {
        shopName,
        mediaNodes: createdProduct?.media?.nodes,
        skipMediaSync: true,
      },
    );
    if (productSyncResult.handle && productSyncResult.handle !== productHandle) {
      await db.bundle.update({
        where: { id: bundleId },
        data: { shopifyProductHandle: productSyncResult.handle },
      });
    }

    // 7. Re-run metafield operations from DB-authoritative state, even when pricing is off.
    const bundleConfig = buildSyncBundleConfiguration(bundle, newProductId);

    AppLogger.info('[SYNC_BUNDLE] Re-running metafield operations', { bundleId, newProductId });

    const [standardResult, componentResult, variantResult] = await Promise.allSettled([
      (async () => {
        const { metafields: standardMetafields } = await convertBundleToStandardMetafields(admin, bundleConfig);
        if (Object.keys(standardMetafields).length > 0) {
          await updateProductStandardMetafields(admin, newProductId, standardMetafields);
        }
      })(),
      updateComponentProductMetafields(admin, newProductId, bundleConfig),
      updateBundleProductMetafields(admin, newProductId, bundleConfig),
    ]);

    if (standardResult.status === 'rejected') {
      AppLogger.warn('[SYNC_BUNDLE] Standard metafields update failed (non-critical)', { bundleId }, standardResult.reason);
    }
    if (componentResult.status === 'rejected') {
      throw new Error(`Failed to update component metafields: ${componentResult.reason}`);
    }
    if (variantResult.status === 'rejected') {
      throw new Error(`Failed to update bundle variant metafields: ${variantResult.reason}`);
    }

    AppLogger.info('[SYNC_BUNDLE] All metafields re-synced successfully', { bundleId });

    // Sync theme colors for bundle widget color inheritance (non-critical, silent fail)
    syncThemeColors(admin, session.shop).catch(() => { /* swallowed — syncThemeColors handles logging */ });

    return json({ success: true, synced: true, message: 'Bundle synced successfully' });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    AppLogger.error('[SYNC_BUNDLE] Error during sync:', { bundleId }, error as any);
    return json({ success: false, error: `Sync failed: ${message}` }, { status: 500 });
  }
}

/**
 * Handle widget placement validation for product page bundles
 */
export async function handleValidateWidgetPlacement(admin: ShopifyAdmin, session: Session, bundleId: string) {
  try {
    AppLogger.debug("[WIDGET_PLACEMENT] Validating widget placement", { bundleId });

    // Get bundle data
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop }
    });

    if (!bundle) {
      return json({
        success: false,
        error: ERROR_MESSAGES.BUNDLE_NOT_FOUND
      }, { status: 404 });
    }

    // Production-ready widget validation (no theme modifications)
    const apiKey = process.env.SHOPIFY_API_KEY || '';
    const result = await WidgetInstallationService.validateProductBundleWidgetSetup(
      admin,
      session.shop,
      apiKey,
      bundleId,
      bundle.shopifyProductId || undefined
    );

    // Return appropriate response based on widget installation status
    if (result.requiresOneTimeSetup) {
      return json({
        success: false,
        requiresOneTimeSetup: true,
        installationLink: result.installationLink,
        message: result.message
      }, { status: 400 });
    }

    return json({
      success: true,
      productUrl: result.productUrl,
      configurationLink: result.configurationLink,
      message: result.message
    });

  } catch (error) {
    AppLogger.error("[WIDGET_PLACEMENT] Error validating widget placement:", {}, error as any);
    return json({
      success: false,
      error: (error as Error).message || "Widget placement validation failed"
    }, { status: 500 });
  }
}

export async function handleUpdateBundleDesignTemplate(
  _admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  formData: FormData
) {
  const { bundleDesignTemplate, bundleDesignPresetId } = parseBundleDesignTemplate(formData);

  const updatedBundle = await db.bundle.update({
    where: { id: bundleId, shopId: session.shop },
    data: { bundleDesignTemplate, bundleDesignPresetId },
    include: {
      steps: {
        include: {
          StepProduct: { orderBy: { position: "asc" } },
          StepCategory: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { position: "asc" },
      },
      pricing: true,
    },
  });

  if (updatedBundle.shopifyProductId) {
    await updateSyncMetafields(
      _admin,
      updatedBundle.shopifyProductId,
      updatedBundle,
    );
  }

  return json({ success: true });
}

export async function handleAssignProductTemplate(
  admin: ShopifyAdmin,
  _session: Session,
  _bundleId: string,
  formData: FormData,
) {
  const rawProductId = String(formData.get("productId") ?? "");
  const templateSuffixValue = formData.get("templateSuffix");
  const templateSuffix = typeof templateSuffixValue === "string" ? templateSuffixValue.trim() : "";
  const productId = normaliseShopifyProductId(rawProductId, {
    title: "Bundle parent product",
    stepName: "Place Widget",
  });

  const ASSIGN_PRODUCT_TEMPLATE = `
    mutation AssignProductTemplate($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product {
          id
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(ASSIGN_PRODUCT_TEMPLATE, {
    variables: {
      product: {
        id: productId,
        templateSuffix: templateSuffix || null,
      },
    },
  });
  const data = await response.json();
  const userErrors = data.data?.productUpdate?.userErrors ?? [];

  if (userErrors.length > 0) {
    const message = userErrors[0]?.message ?? "Failed to assign product template";
    return json({ success: false, error: message }, { status: 400 });
  }

  return json({
    success: true,
    productId,
    templateSuffix: templateSuffix || null,
    handle: data.data?.productUpdate?.product?.handle ?? null,
  });
}
