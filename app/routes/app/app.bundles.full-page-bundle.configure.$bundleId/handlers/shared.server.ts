import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import { getBundleProductVariantId } from "../../../../utils/variant-lookup.server";
import { parseConditionValue } from "../../../../lib/parse-condition-value";
import {
  safeJsonParse,
  getShopifyStatusFromBundleStatus,
  buildBundleProductDescriptionHtml,
} from "../../../../services/bundles/bundle-configure-handlers.server";
import { BundleStatus, BundleType, FullPageLayout } from "../../../../constants/bundle";
import { formatStepCategoriesForRuntime } from "../../../../lib/bundle-config/category-runtime";

const DEFAULT_PROGRESS_MESSAGE = "Add {conditionText} to get {discountText}";
const DEFAULT_SUCCESS_MESSAGE = "Congratulations! You got {discountText}";

export function parseIndividualSellingPlanSelection(formData: FormData) {
  const raw = safeJsonParse(formData.get("individualSellingPlanSelection") as string | null, {
    isEnabled: false,
    showFor: "ALL_PRODUCTS",
  }) as { isEnabled?: unknown; showFor?: unknown };
  const showFor = raw.showFor === "OOS_PRODUCTS" ? "OOS_PRODUCTS" : "ALL_PRODUCTS";

  return {
    isEnabled: raw.isEnabled === true,
    showFor,
  };
}

// FPB products do not need a theme template — the URL redirect (/products/{handle} →
// /pages/{pageHandle}) handles routing before the template is ever rendered.
// We only update the Shopify product status so it stays in sync with the bundle status.
async function updateFpbProductStatus(
  admin: ShopifyAdmin,
  productId: string,
  shopifyStatus: string,
  descriptionHtml?: string,
) {
  const response = await admin.graphql(`
    mutation SyncFpbProductStatus($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product { id status }
        userErrors { field message }
      }
    }
  `, {
    variables: {
      product: {
        id: productId,
        status: shopifyStatus,
        ...(descriptionHtml ? { descriptionHtml } : {}),
      },
    },
  });

  return response.json() as Promise<{ data?: Record<string, any>; errors?: unknown[] }>;
}

async function setFpbParentVariantRequiresComponents(
  admin: ShopifyAdmin,
  productId: string,
  parentVariantId: string,
  requiresComponents: boolean,
) {
  const response = await admin.graphql(`
    mutation SetFpbParentVariantRequiresComponents($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants { id requiresComponents }
        userErrors { field message code }
      }
    }
  `, {
    variables: {
      productId,
      variants: [{ id: parentVariantId, requiresComponents }],
    },
  });

  const data = await response.json() as { data?: Record<string, any>; errors?: unknown[] };
  return data.data?.productVariantsBulkUpdate?.userErrors ?? [];
}

function hasUnsupportedBundlePublicationError(userErrors: any[]) {
  return userErrors.some((error) =>
    typeof error?.message === "string"
    && error.message.includes("does not support bundle products")
  );
}

async function activateFpbBundleProductWithParentSequence(
  admin: ShopifyAdmin,
  productId: string,
  bundleId: string,
) {
  const parentVariantId = await getBundleProductVariantId(admin, productId);

  const disableErrors = await setFpbParentVariantRequiresComponents(admin, productId, parentVariantId, false);
  if (disableErrors.length > 0) {
    AppLogger.warn("[PRODUCT_SYNC] Could not temporarily clear FPB parent requiresComponents", {
      component: "app.bundles.full-page.configure",
      bundleId, productId, parentVariantId,
    }, { userErrors: disableErrors });
    return;
  }

  const retryData = await updateFpbProductStatus(admin, productId, "ACTIVE");
  const retryErrors = retryData.data?.productUpdate?.userErrors ?? [];
  if (retryData.errors?.length || retryErrors.length > 0) {
    await setFpbParentVariantRequiresComponents(admin, productId, parentVariantId, true);
    AppLogger.warn("[PRODUCT_SYNC] FPB parent activation still failed after clearing requiresComponents", {
      component: "app.bundles.full-page.configure",
      bundleId, productId, parentVariantId,
    }, { errors: retryData.errors, userErrors: retryErrors });
    return;
  }

  const restoreErrors = await setFpbParentVariantRequiresComponents(admin, productId, parentVariantId, true);
  if (restoreErrors.length > 0) {
    await updateFpbProductStatus(admin, productId, "DRAFT");
    await setFpbParentVariantRequiresComponents(admin, productId, parentVariantId, true);
    AppLogger.warn("[PRODUCT_SYNC] Reverted FPB parent product after requiresComponents restore failed", {
      component: "app.bundles.full-page.configure",
      bundleId, productId, parentVariantId,
    }, { userErrors: restoreErrors });
    return;
  }

  AppLogger.info("[PRODUCT_SYNC] FPB bundle parent activated with requiresComponents sequence", {
    component: "app.bundles.full-page.configure",
    bundleId, productId, parentVariantId,
  });
}

export async function syncFpbProductStatus(
  admin: ShopifyAdmin,
  productId: string,
  bundleId: string,
  finalStatus: BundleStatus,
  bundleName: string,
  bundleDescription: string | null,
) {
  try {
    const shopifyStatus = getShopifyStatusFromBundleStatus(finalStatus);
    const descriptionHtml = buildBundleProductDescriptionHtml({
      bundleName,
      customDescription: bundleDescription,
      status: finalStatus,
    });

    const responseData = await updateFpbProductStatus(
      admin,
      productId,
      shopifyStatus,
      descriptionHtml,
    );

    if (responseData.errors?.length) {
      AppLogger.warn("[PRODUCT_SYNC] GraphQL transport error updating FPB product status", {
        component: "app.bundles.full-page.configure",
        bundleId, productId, shopifyStatus,
      }, responseData.errors);
      return;
    }

    const userErrors = responseData.data?.productUpdate?.userErrors ?? [];
    if (userErrors.length > 0) {
      AppLogger.warn("[PRODUCT_SYNC] Shopify errors updating FPB product status", {
        component: "app.bundles.full-page.configure",
        bundleId, productId, shopifyStatus,
      }, { userErrors });
      if (shopifyStatus === "ACTIVE" && finalStatus === BundleStatus.ACTIVE && hasUnsupportedBundlePublicationError(userErrors)) {
        await activateFpbBundleProductWithParentSequence(admin, productId, bundleId);
      }
      return;
    }

    if (finalStatus === BundleStatus.UNLISTED) {
      const unlistedResponseData = await updateFpbProductStatus(admin, productId, "UNLISTED", descriptionHtml);
      const unlistedErrors = unlistedResponseData.data?.productUpdate?.userErrors ?? [];
      if (unlistedResponseData.errors?.length) {
        AppLogger.warn("[PRODUCT_SYNC] GraphQL transport error updating FPB product status to UNLISTED", {
          component: "app.bundles.full-page.configure",
          bundleId, productId,
        }, unlistedResponseData.errors);
        return;
      }
      if (unlistedErrors.length > 0) {
        AppLogger.warn("[PRODUCT_SYNC] Shopify errors updating FPB product status to UNLISTED", {
          component: "app.bundles.full-page.configure",
          bundleId, productId,
        }, { userErrors: unlistedErrors });
        return;
      }
      AppLogger.info("[PRODUCT_SYNC] FPB product status synced to UNLISTED", {
        component: "app.bundles.full-page.configure",
        bundleId,
        productId,
      });
      return;
    }

    AppLogger.info("[PRODUCT_SYNC] FPB product status synced", {
      component: "app.bundles.full-page.configure",
      bundleId, productId,
      status: responseData.data?.productUpdate?.product?.status ?? shopifyStatus,
    });
  } catch (error) {
    AppLogger.warn("[PRODUCT_SYNC] Failed to sync FPB product status (non-fatal)", {
      component: "app.bundles.full-page.configure",
      bundleId, productId, shopifyStatus: getShopifyStatusFromBundleStatus(finalStatus),
    }, error as Error);
  }
}

function buildFullPageBundlePricing(pricing: any) {
  if (!pricing) {
    return null;
  }

  const parsedMessages = safeJsonParse(pricing.messages, {});
  const ruleMessages = parsedMessages.ruleMessages || {};
  const firstRuleId = Object.keys(ruleMessages)[0];
  const firstRuleMessage = firstRuleId ? ruleMessages[firstRuleId] : null;

  return {
    enabled: pricing.enabled,
    method: pricing.method || "percentage_off",
    rules: safeJsonParse(pricing.rules, []).map((rule: any) => {
      const conditionValue = Number(rule.conditionValue ?? rule.condition?.value ?? rule.value ?? 0) || 0;
      const discountValue = Number(rule.discountValue ?? rule.discount?.value ?? 0) || 0;
      const flat: Record<string, unknown> = {
        id: rule.id,
        conditionType: rule.conditionType || rule.condition?.type || "quantity",
        conditionValue,
        discountValue,
      };
      if (rule.customerBuys !== undefined) flat.customerBuys = Number(rule.customerBuys);
      if (rule.customerGets !== undefined) flat.customerGets = Number(rule.customerGets);
      if (rule.bxyDiscountType !== undefined) flat.bxyDiscountType = rule.bxyDiscountType;
      if (rule.bxyApplyMode !== undefined) flat.bxyApplyMode = rule.bxyApplyMode;
      return flat;
    }),
    display: {
      showFooter: pricing.showFooter !== false,
      showDiscountProgressBar: pricing.showProgressBar === true,
    },
    messages: {
      progress: firstRuleMessage?.discountText || DEFAULT_PROGRESS_MESSAGE,
      qualified: firstRuleMessage?.successMessage || DEFAULT_SUCCESS_MESSAGE,
      showInCart: true,
      showDiscountMessaging: parsedMessages.showDiscountMessaging || false,
      displayOptions: parsedMessages.displayOptions || null,
      tierTextByRuleId: parsedMessages.tierTextByRuleId || null,
      tierTextByLocaleByRuleId: parsedMessages.tierTextByLocaleByRuleId || null,
    },
  };
}

function buildFullPageBundleMetafieldSteps(steps: any[] = []) {
  return steps.map((step: any, index: number) => {
    const rawStepProducts = Array.isArray(step.StepProduct) && step.StepProduct.length > 0
      ? step.StepProduct
      : Array.isArray(step.products)
        ? step.products
        : [];

    const stepProducts = rawStepProducts
      .map((product: any) => ({
        productId: product.productId || product.id || null,
        title: product.title || product.name || "Product",
        imageUrl: product.imageUrl || product.image?.url || null,
        variants: Array.isArray(product.variants) ? product.variants : null,
      }))
      .filter((product: { productId: string | null }) => Boolean(product.productId));

    const categoriesForMetafield = formatStepCategoriesForRuntime(step, rawStepProducts);
    const stepCollections = Array.isArray(step.collections) ? step.collections : [];

    return {
      id: step.id,
      name: step.name || `Step ${index + 1}`,
      pageTitle: step.pageTitle ?? null,
      multiLangData: step.multiLangData ?? {},
      stepImage: step.stepImage ?? step.timelineIconUrl ?? null,
      position: step.position ?? index + 1,
      minQuantity: step.minQuantity || 1,
      maxQuantity: step.maxQuantity || 1,
      enabled: step.enabled !== false,
      conditionType: step.conditionType ?? null,
      conditionOperator: step.conditionOperator ?? null,
      conditionValue: step.conditionValue ?? null,
      conditionOperator2: step.conditionOperator2 ?? null,
      conditionValue2: step.conditionValue2 ?? null,
      StepProduct: stepProducts,
      products: stepProducts.map((product: any) => ({
        id: product.productId,
        title: product.title,
        imageUrl: product.imageUrl,
      })),
      collections: stepCollections.map((c: any) => ({ id: c.id, handle: c.handle, title: c.title || 'Collection' })),
      ...(categoriesForMetafield.length > 0 ? { categories: categoriesForMetafield } : {}),
    };
  });
}

/**
 * Create a Shopify URL redirect from /products/{productHandle} → /pages/{pageHandle}.
 * Shopify URL redirects are applied before theme routing, so this reliably sends
 * customers to the full-page bundle page even if the product still exists.
 * Non-fatal — logs warnings but never throws.
 */
export async function createProductPageRedirect(
  admin: ShopifyAdmin,
  productId: string,
  pageHandle: string,
): Promise<void> {
  try {
    const productRes = await admin.graphql(`
      query GetProductHandle($id: ID!) {
        product(id: $id) { handle }
      }
    `, { variables: { id: productId } });
    const productData = await productRes.json() as { data?: { product?: { handle?: string } } };
    const productHandle = productData?.data?.product?.handle;

    if (!productHandle) {
      AppLogger.warn("[URL_REDIRECT] Could not resolve product handle — skipping redirect creation", { productId });
      return;
    }

    const path = `/products/${productHandle}`;
    const target = `/pages/${pageHandle}`;

    const redirectRes = await admin.graphql(`
      mutation CreateBundleRedirect($path: String!, $target: String!) {
        urlRedirectCreate(urlRedirect: { path: $path, target: $target }) {
          urlRedirect { id }
          userErrors { field message }
        }
      }
    `, { variables: { path, target } });
    const redirectData = await redirectRes.json() as any;
    const userErrors = redirectData?.data?.urlRedirectCreate?.userErrors ?? [];

    if (userErrors.length > 0) {
      AppLogger.warn("[URL_REDIRECT] userErrors creating product page redirect (may already exist)", {
        productId, path, target, userErrors,
      });
    } else {
      AppLogger.info("[URL_REDIRECT] Created product page redirect", { path, target });
    }
  } catch (error) {
    AppLogger.warn("[URL_REDIRECT] Failed to create product page redirect (non-fatal)", {
      productId, pageHandle,
    }, error as Error);
  }
}

export function buildFullPageBundleMetafieldConfig(bundle: any, overrides: Record<string, unknown> = {}) {
  return {
    bundleId: bundle.id,
    id: bundle.id,
    name: bundle.name,
    description: bundle.description || "",
    status: bundle.status,
    bundleType: bundle.bundleType || BundleType.FULL_PAGE,
    fullPageLayout: bundle.fullPageLayout || FullPageLayout.FOOTER_BOTTOM,
    templateName: bundle.templateName || null,
    shopifyProductId: bundle.shopifyProductId || null,
    shopifyPageHandle: (
      overrides.shopifyPageHandle as string | null | undefined
    ) ?? bundle.shopifyPageHandle ?? null,
    promoBannerBgImage: bundle.promoBannerBgImage ?? null,
    loadingGif: bundle.loadingGif ?? null,
    type: "cart_transform",
    steps: buildFullPageBundleMetafieldSteps(bundle.steps || []),
    pricing: buildFullPageBundlePricing(bundle.pricing),
    boxSelection: bundle.boxSelection ?? null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/** Build the base bundle configuration object passed to metafield update functions. */
export function buildFpbBaseConfig(
  updatedBundle: { id: string; name: string; description: string | null; status: string; bundleType: string; fullPageLayout: string | null; templateName: string | null; shopifyProductId: string | null; shopifyPageHandle: string | null; personalizationData?: unknown; boxSelection?: unknown; bundleUpsellConfig?: unknown; individualSellingPlanSelection?: unknown },
  stepsData: any[],
  stepConditionsData: Record<string, any[]>,
  discountData: any,
  bundleParentVariantId: string | null,
  directBoxSelection: unknown = null,
): Record<string, unknown> {
  const optimizedSteps = (stepsData || []).map((step: any) => {
    const categoriesForRuntime = formatStepCategoriesForRuntime(step, Array.isArray(step.StepProduct) ? step.StepProduct : []);

    return {
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
        handle: collection.handle || null,
      })),
      filters: Array.isArray(step.filters) ? step.filters : null,
      ...(categoriesForRuntime.length > 0 ? { categories: categoriesForRuntime } : {}),
    };
  });

  const firstRuleId = discountData.discountRules?.[0]?.id;
  const firstRuleMsg = firstRuleId && discountData.ruleMessages?.[firstRuleId];

  return {
    bundleId: updatedBundle.id,
    id: updatedBundle.id,
    name: updatedBundle.name,
    description: updatedBundle.description,
    status: updatedBundle.status,
    bundleType: updatedBundle.bundleType,
    fullPageLayout: updatedBundle.fullPageLayout || FullPageLayout.FOOTER_BOTTOM,
    templateName: updatedBundle.templateName,
    steps: optimizedSteps,
    pricing: {
      enabled: discountData.discountEnabled,
      method: discountData.discountType,
      rules: (discountData.discountRules || []).map((rule: any) => {
        const flat: Record<string, unknown> = {
          id: rule.id,
          conditionType: rule.conditionType || 'quantity',
          conditionValue: Number(rule.conditionValue ?? rule.value ?? 0) || 0,
          discountValue: Number(rule.discountValue ?? 0) || 0,
        };
        if (rule.customerBuys !== undefined) flat.customerBuys = Number(rule.customerBuys);
        if (rule.customerGets !== undefined) flat.customerGets = Number(rule.customerGets);
        if (rule.bxyDiscountType !== undefined) flat.bxyDiscountType = rule.bxyDiscountType;
        if (rule.bxyApplyMode !== undefined) flat.bxyApplyMode = rule.bxyApplyMode;
        return flat;
      }),
      display: {
        showFooter: discountData.showFooter !== false,
        showDiscountProgressBar: discountData.showDiscountProgressBar === true,
      },
      messages: {
        progress: firstRuleMsg?.discountText || 'Add {conditionText} to get {discountText}',
        qualified: firstRuleMsg?.successMessage || 'Congratulations! You got {discountText}',
        showDiscountMessaging: discountData.discountMessagingEnabled || false,
        showInCart: true,
        displayOptions: discountData.pricingDisplayOptions || null,
        ruleMessagesByLocale: discountData.ruleMessagesByLocale || null,
        tierTextByRuleId: discountData.tierTextByRuleId || null,
        tierTextByLocaleByRuleId: discountData.tierTextByLocaleByRuleId || null,
      },
    },
    bundleParentVariantId: bundleParentVariantId,
    boxSelection: updatedBundle.boxSelection ?? directBoxSelection ?? null,
    bundleUpsellConfig: (updatedBundle as any).bundleUpsellConfig ?? null,
    bundleTextConfig: (updatedBundle as any).bundleTextConfig ?? null,
    productSlotsEnabled: (updatedBundle as any).productSlotsEnabled ?? false,
    productSlotIconUrl: (updatedBundle as any).productSlotIconUrl ?? null,
    validateQuantityPerProduct: (updatedBundle as any).validateQuantityPerProduct ?? {
      isEnabled: false,
      allowedQuantity: 1,
    },
    individualSellingPlanSelection: (updatedBundle as any).individualSellingPlanSelection ?? {
      isEnabled: false,
      showFor: "ALL_PRODUCTS",
    },
    personalizationData: (updatedBundle as any).personalizationData ?? null,
    shopifyProductId: updatedBundle.shopifyProductId,
    shopifyPageHandle: updatedBundle.shopifyPageHandle || null,
    updatedAt: new Date().toISOString(),
  };
}

