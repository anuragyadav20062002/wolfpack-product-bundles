import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import { parseConditionValue } from "../../../../lib/parse-condition-value";
import { safeJsonParse } from "../../../../services/bundles/bundle-configure-handlers.server";
import {
  BundleStatus,
  BundleType,
  FullPageLayout,
} from "../../../../constants/bundle";
import { formatStepCategoriesForRuntime } from "../../../../lib/bundle-config/category-runtime";

const DEFAULT_PROGRESS_MESSAGE = "Add {conditionText} to get {discountText}";
const DEFAULT_SUCCESS_MESSAGE = "Congratulations! You got {discountText}";

export function parseIndividualSellingPlanSelection(formData: FormData) {
  const raw = safeJsonParse(
    formData.get("individualSellingPlanSelection") as string | null,
    {
      isEnabled: false,
      showFor: "ALL_PRODUCTS",
    },
  ) as { isEnabled?: unknown; showFor?: unknown };
  const showFor =
    raw.showFor === "OOS_PRODUCTS" ? "OOS_PRODUCTS" : "ALL_PRODUCTS";

  return {
    isEnabled: raw.isEnabled === true,
    showFor,
  };
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
      const conditionValue =
        Number(
          rule.conditionValue ?? rule.condition?.value ?? rule.value ?? 0,
        ) || 0;
      const discountValue =
        Number(rule.discountValue ?? rule.discount?.value ?? 0) || 0;
      const flat: Record<string, unknown> = {
        id: rule.id,
        conditionType: rule.conditionType || rule.condition?.type || "quantity",
        conditionValue,
        discountValue,
      };
      if (rule.customerBuys !== undefined)
        flat.customerBuys = Number(rule.customerBuys);
      if (rule.customerGets !== undefined)
        flat.customerGets = Number(rule.customerGets);
      if (rule.bxyDiscountType !== undefined)
        flat.bxyDiscountType = rule.bxyDiscountType;
      if (rule.bxyApplyMode !== undefined)
        flat.bxyApplyMode = rule.bxyApplyMode;
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
    const rawStepProducts =
      Array.isArray(step.StepProduct) && step.StepProduct.length > 0
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
      .filter((product: { productId: string | null }) =>
        Boolean(product.productId),
      );

    const categoriesForMetafield = formatStepCategoriesForRuntime(
      step,
      rawStepProducts,
    );
    const stepCollections = Array.isArray(step.collections)
      ? step.collections
      : [];

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
      collections: stepCollections.map((c: any) => ({
        id: c.id,
        handle: c.handle,
        title: c.title || "Collection",
      })),
      ...(categoriesForMetafield.length > 0
        ? { categories: categoriesForMetafield }
        : {}),
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
    const productRes = await admin.graphql(
      `
      query GetProductHandle($id: ID!) {
        product(id: $id) { handle }
      }
    `,
      { variables: { id: productId } },
    );
    const productData = (await productRes.json()) as {
      data?: { product?: { handle?: string } };
    };
    const productHandle = productData?.data?.product?.handle;

    if (!productHandle) {
      AppLogger.warn(
        "[URL_REDIRECT] Could not resolve product handle — skipping redirect creation",
        { productId },
      );
      return;
    }

    const path = `/products/${productHandle}`;
    const target = `/pages/${pageHandle}`;

    const redirectRes = await admin.graphql(
      `
      mutation CreateBundleRedirect($path: String!, $target: String!) {
        urlRedirectCreate(urlRedirect: { path: $path, target: $target }) {
          urlRedirect { id }
          userErrors { field message }
        }
      }
    `,
      { variables: { path, target } },
    );
    const redirectData = (await redirectRes.json()) as any;
    const userErrors = redirectData?.data?.urlRedirectCreate?.userErrors ?? [];

    if (userErrors.length > 0) {
      AppLogger.warn(
        "[URL_REDIRECT] userErrors creating product page redirect (may already exist)",
        {
          productId,
          path,
          target,
          userErrors,
        },
      );
    } else {
      AppLogger.info("[URL_REDIRECT] Created product page redirect", {
        path,
        target,
      });
    }
  } catch (error) {
    AppLogger.warn(
      "[URL_REDIRECT] Failed to create product page redirect (non-fatal)",
      {
        productId,
        pageHandle,
      },
      error as Error,
    );
  }
}

export function buildFullPageBundleMetafieldConfig(
  bundle: any,
  overrides: Record<string, unknown> = {},
) {
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
    shopifyPageHandle:
      (overrides.shopifyPageHandle as string | null | undefined) ??
      bundle.shopifyPageHandle ??
      null,
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
  updatedBundle: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    bundleType: string;
    fullPageLayout: string | null;
    templateName: string | null;
    shopifyProductId: string | null;
    shopifyPageHandle: string | null;
    personalizationData?: unknown;
    boxSelection?: unknown;
    bundleUpsellConfig?: unknown;
    individualSellingPlanSelection?: unknown;
  },
  stepsData: any[],
  stepConditionsData: Record<string, any[]>,
  discountData: any,
  bundleParentVariantId: string | null,
  directBoxSelection: unknown = null,
): Record<string, unknown> {
  const optimizedSteps = (stepsData || []).map((step: any) => {
    const categoriesForRuntime = formatStepCategoriesForRuntime(
      step,
      Array.isArray(step.StepProduct) ? step.StepProduct : [],
    );

    return {
      id: step.id,
      name: step.name || "Step",
      pageTitle: step.pageTitle ?? null,
      multiLangData: step.multiLangData ?? {},
      stepImage: step.stepImage ?? null,
      minQuantity: parseInt(step.minQuantity) || 1,
      maxQuantity: parseInt(step.maxQuantity) || 1,
      enabled: step.enabled !== false,
      conditionType: stepConditionsData[step.id]?.[0]?.type || null,
      conditionOperator: stepConditionsData[step.id]?.[0]?.operator || null,
      conditionValue: parseConditionValue(
        stepConditionsData[step.id]?.[0]?.value,
      ),
      conditionOperator2: stepConditionsData[step.id]?.[1]?.operator || null,
      conditionValue2: parseConditionValue(
        stepConditionsData[step.id]?.[1]?.value,
      ),
      autoNextStepOnConditionMet:
        stepConditionsData[step.id]?.[0]?.autoNext === true ||
        stepConditionsData[step.id]?.[0]?.autoNext === "true" ||
        step.autoNextStepOnConditionMet === true,
      products: (step.StepProduct || []).map((product: any) => ({
        id: product.id,
        title: product.title || product.name || "Product",
        imageUrl: product.imageUrl || product.image?.url || null,
      })),
      collections: (step.collections || []).map((collection: any) => ({
        id: collection.id,
        title: collection.title || "Collection",
        handle: collection.handle || null,
      })),
      filters: Array.isArray(step.filters) ? step.filters : null,
      ...(categoriesForRuntime.length > 0
        ? { categories: categoriesForRuntime }
        : {}),
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
    fullPageLayout:
      updatedBundle.fullPageLayout || FullPageLayout.FOOTER_BOTTOM,
    templateName: updatedBundle.templateName,
    steps: optimizedSteps,
    pricing: {
      enabled: discountData.discountEnabled,
      method: discountData.discountType,
      rules: (discountData.discountRules || []).map((rule: any) => {
        const flat: Record<string, unknown> = {
          id: rule.id,
          conditionType: rule.conditionType || "quantity",
          conditionValue: Number(rule.conditionValue ?? rule.value ?? 0) || 0,
          discountValue: Number(rule.discountValue ?? 0) || 0,
        };
        if (rule.customerBuys !== undefined)
          flat.customerBuys = Number(rule.customerBuys);
        if (rule.customerGets !== undefined)
          flat.customerGets = Number(rule.customerGets);
        if (rule.bxyDiscountType !== undefined)
          flat.bxyDiscountType = rule.bxyDiscountType;
        if (rule.bxyApplyMode !== undefined)
          flat.bxyApplyMode = rule.bxyApplyMode;
        return flat;
      }),
      display: {
        showFooter: discountData.showFooter !== false,
        showDiscountProgressBar: discountData.showDiscountProgressBar === true,
      },
      messages: {
        progress:
          firstRuleMsg?.discountText ||
          "Add {conditionText} to get {discountText}",
        qualified:
          firstRuleMsg?.successMessage ||
          "Congratulations! You got {discountText}",
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
    validateQuantityPerProduct: (updatedBundle as any)
      .validateQuantityPerProduct ?? {
      isEnabled: false,
      allowedQuantity: 1,
    },
    individualSellingPlanSelection: (updatedBundle as any)
      .individualSellingPlanSelection ?? {
      isEnabled: false,
      showFor: "ALL_PRODUCTS",
    },
    personalizationData: (updatedBundle as any).personalizationData ?? null,
    shopifyProductId: updatedBundle.shopifyProductId,
    shopifyPageHandle: updatedBundle.shopifyPageHandle || null,
    updatedAt: new Date().toISOString(),
  };
}
