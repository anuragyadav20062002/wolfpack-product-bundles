export function toNumericShopifyId(id: string | undefined | null): string {
  if (!id) return "";
  const match = id.match(/\/(\d+)$/);
  return match ? match[1] : id;
}

export function toProductGid(product: any): string {
  return (
    product?.graphqlId ||
    product?.id ||
    (product?.productId ? `gid://shopify/Product/${product.productId}` : "")
  );
}

export function toVariantGid(variant: any): string {
  return (
    variant?.variantGraphqlId ||
    variant?.id ||
    (variant?.variantId
      ? `gid://shopify/ProductVariant/${variant.variantId}`
      : "")
  );
}

export function normalizeAddonPickerProduct(product: any) {
  const productGid = toProductGid(product);
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const imageUrl =
    product?.images?.[0]?.originalSrc ||
    product?.images?.[0]?.url ||
    product?.image?.url ||
    product?.imageUrl ||
    null;

  return {
    id: productGid,
    productId: toNumericShopifyId(productGid || product?.productId),
    graphqlId: productGid,
    handle: product?.handle ?? null,
    variants: variants.map((variant: any) => {
      const variantGid = toVariantGid(variant);
      return {
        variantId: toNumericShopifyId(variantGid || variant?.variantId),
        variantGraphqlId: variantGid,
        inventoryQuantity:
          typeof variant?.inventoryQuantity === "number"
            ? variant.inventoryQuantity
            : null,
        inventoryPolicy: variant?.inventoryPolicy ?? null,
        price: String(variant?.price ?? "0"),
        variantTitle:
          variant?.title || variant?.variantTitle || "Default Title",
      };
    }),
    hasOnlyDefaultVariant:
      product?.hasOnlyDefaultVariant ?? variants.length <= 1,
    images: imageUrl ? [{ originalSrc: imageUrl }] : [],
    title: product?.title || product?.name || "",
    tags: Array.isArray(product?.tags) ? product.tags : [],
  };
}

export function normalizeAddonTier(tier: any, index: number) {
  const eligibilityType =
    tier?.eligibilityCondition?.type || tier?.eligibilityType || "QUANTITY";
  const eligibilityValue = Math.max(
    0,
    Number(tier?.eligibilityCondition?.value ?? tier?.eligibilityValue ?? 1) ||
      0,
  );
  const discountType =
    tier?.discount?.type || tier?.discountType || "PERCENTAGE";
  const discountValue = Math.min(
    100,
    Math.max(0, Number(tier?.discount?.value ?? tier?.discountValue ?? 0) || 0),
  );

  return {
    tierId: tier?.tierId || `tier${index + 1}`,
    title: tier?.title || `Tier ${index + 1}`,
    selectedAddonProducts: Array.isArray(tier?.selectedAddonProducts)
      ? tier.selectedAddonProducts.map(normalizeAddonPickerProduct)
      : [],
    eligibilityCondition: {
      type: eligibilityType,
      value: eligibilityValue,
      isValidateEligibilityConditionEnabled:
        tier?.eligibilityCondition?.isValidateEligibilityConditionEnabled !==
        false,
    },
    discount: {
      type: discountType,
      value: discountValue,
    },
    displayVariantsAsIndividualProducts_addons:
      tier?.displayVariantsAsIndividualProducts_addons === true,
    conditions: Array.isArray(tier?.conditions)
      ? tier.conditions.map((condition: any) => ({
          type: condition?.type || "quantity",
          condition: condition?.condition || "lessThanOrEqualTo",
          value: String(condition?.value ?? "1"),
        }))
      : [],
  };
}

export function createDefaultAddonDraftTier(index = 0) {
  return {
    tierId: `tier${index + 1}`,
    title: `Tier ${index + 1}`,
    selectedAddonProducts: [],
    eligibilityType: "QUANTITY",
    eligibilityValue: 1,
    discountType: "PERCENTAGE",
    discountValue: 0,
    displayVariantsAsIndividualProducts_addons: false,
    displayFree: false,
    conditions: [],
  };
}

export function createDefaultAddonTierCondition() {
  return {
    type: "quantity",
    condition: "lessThanOrEqualTo",
    value: "1",
  };
}

export function addonTierToDraft(tier: any, index: number) {
  return {
    ...createDefaultAddonDraftTier(index),
    tierId: tier?.tierId || `tier${index + 1}`,
    title: tier?.title || `Tier ${index + 1}`,
    selectedAddonProducts: Array.isArray(tier?.selectedAddonProducts)
      ? tier.selectedAddonProducts
      : [],
    eligibilityType:
      tier?.eligibilityCondition?.type || tier?.eligibilityType || "QUANTITY",
    eligibilityValue:
      Number(
        tier?.eligibilityCondition?.value ?? tier?.eligibilityValue ?? 1,
      ) || 1,
    discountType: tier?.discount?.type || tier?.discountType || "PERCENTAGE",
    discountValue:
      Number(tier?.discount?.value ?? tier?.discountValue ?? 0) || 0,
    displayVariantsAsIndividualProducts_addons:
      tier?.displayVariantsAsIndividualProducts_addons === true,
    displayFree: false,
    conditions: Array.isArray(tier?.conditions)
      ? tier.conditions.map((condition: any) => ({
          type: condition?.type || "quantity",
          condition: condition?.condition || "lessThanOrEqualTo",
          value: String(condition?.value ?? "1"),
        }))
      : [],
  };
}

export function buildAddonDraftFromPersonalizationData(
  personalizationData: any,
) {
  const addonProducts = personalizationData?.addonProducts || {};
  const tiers =
    Array.isArray(addonProducts?.tiers)
      ? addonProducts.tiers.map(addonTierToDraft)
      : [];

  return {
    isPersonalizationEnabled:
      personalizationData?.isPersonalizationEnabled === true,
    personalizeStepText: personalizationData?.personalizeStepText || "",
    personalizePageSubtext: personalizationData?.personalizePageSubtext || "",
    stepImage: personalizationData?.stepImage || null,
    addonProductsEnabled: addonProducts?.isEnabled === true,
    addonProductsTitle: addonProducts?.title || "",
    addonTiers: tiers,
    addonMultiLangData: addonProducts?.multiLangData || {},
  };
}

export function buildPersonalizationDataFromDraft(
  addonDraft: any,
  addonMessages: { discountText?: string; successMessage?: string } | null,
) {
  const isPersonalizationEnabled = addonDraft?.isPersonalizationEnabled === true;
  const addonProductsEnabled = addonDraft?.addonProductsEnabled === true;
  if (!isPersonalizationEnabled && !addonProductsEnabled) return null;

  const addonTiers =
    Array.isArray(addonDraft?.addonTiers)
      ? addonDraft.addonTiers
      : [];
  const tiers = addonTiers.map(normalizeAddonTier);

  const personalizationData: Record<string, any> = {
    isPersonalizationEnabled,
    personalizeStepText: addonDraft?.personalizeStepText || "",
    personalizePageSubtext: addonDraft?.personalizePageSubtext || "",
    stepImage: addonDraft?.stepImage || null,
    addonProducts: {
      isEnabled: addonProductsEnabled,
      title: addonDraft?.addonProductsTitle || "",
      type: "MULTI_TIER",
      tiers,
      multiLangData: addonDraft?.addonMultiLangData || {},
      addonsMessaging: {
        isEnabled: Boolean(
          addonMessages?.discountText || addonMessages?.successMessage,
        ),
        tier1: {
          ineligibleState: addonMessages?.discountText || "",
          eligibleState: addonMessages?.successMessage || "",
        },
      },
    },
  };

  return personalizationData;
}
