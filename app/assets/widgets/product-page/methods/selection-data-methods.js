import { BUNDLE_WIDGET, PricingCalculator } from '../../../bundle-widget-components.js';

export const ProductPageSelectionDataMethods = {
isInventoryTrackingOnAddToCartEnabled() {
  const controls = typeof this._getProductPageControls === 'function'
    ? this._getProductPageControls()
    : null;
  return controls?.trackInventoryOnAddToCart === true;
},

/**
 * Look up real stock for a variant. See full-page widget's getVariantAvailable
 * for field semantics.
 */
getVariantAvailable(stepIndex, variantId) {
  const products = this.stepProductData[stepIndex] || [];
  const product = this.findProductBySelectionKey(products, variantId);
  if (!product) {
    return { available: null, outOfStock: false, acceptsBackorder: false };
  }
  if (product.available === false) {
    return { available: 0, outOfStock: true, acceptsBackorder: false };
  }
  const qty = typeof product.quantityAvailable === 'number' ? product.quantityAvailable : null;
  const backorder = product.currentlyNotInStock === true;
  const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
    ? this.isInventoryTrackingOnAddToCartEnabled()
    : ProductPageSelectionDataMethods.isInventoryTrackingOnAddToCartEnabled.call(this);
  if (!trackInventoryOnAddToCart) {
    return { available: null, outOfStock: false, acceptsBackorder: backorder };
  }
  if (trackInventoryOnAddToCart && qty === 0 && !backorder) {
    return { available: 0, outOfStock: true, acceptsBackorder: false };
  }
  return { available: qty === 0 ? null : qty, outOfStock: false, acceptsBackorder: backorder };
},

findProductBySelectionKey(products, selectionKey) {
  const normalized = this.normalizeSelectionKey(selectionKey);
  if (!normalized) return null;

  return products.find((product) => {
    const ids = [product.variantId, product.id, product.productId];
    if (Array.isArray(product.variants)) {
      ids.push(...product.variants.map((variant) => variant.id));
    }

    return ids.some((id) => this.normalizeSelectionKey(id) === normalized);
  }) || null;
},

shouldApplyIndividualSellingPlanSelection() {
  return this.selectedBundle?.individualSellingPlanSelection?.isEnabled === true;
},

shouldApplyIndividualSellingPlanSelectionForProduct(product, variantId) {
  if (!this.shouldApplyIndividualSellingPlanSelection()) {
    return false;
  }

  const showFor = this.selectedBundle?.individualSellingPlanSelection?.showFor;
  if (showFor !== "OOS_PRODUCTS") {
    return true;
  }

  const normalizedSelectedId = this.extractId(variantId) || String(variantId || "");
  const variant = Array.isArray(product?.variants)
    ? product.variants.find((candidate) => this.extractId(candidate.id) === normalizedSelectedId)
    : null;

  const target = variant ?? product;
  if (!target) {
    return false;
  }

  return target.available === false;
},

getSelectedSellingPlanAllocationId(product, variantId) {
  if (!this.shouldApplyIndividualSellingPlanSelectionForProduct(product, variantId)) {
    return null;
  }

  const normalizedSelectedId = this.extractId(variantId) || String(variantId || '');
  const variant = Array.isArray(product?.variants)
    ? product.variants.find((candidate) => this.extractId(candidate.id) === normalizedSelectedId)
    : null;

  const normalizedProduct = (variant?.sellingPlanAllocations !== undefined ? variant : product) || {};
  const allocations = Array.isArray(normalizedProduct.sellingPlanAllocations)
    ? normalizedProduct.sellingPlanAllocations
    : [];

  if (allocations.length === 0) {
    return null;
  }

  const firstAllocationId = this.extractId(allocations[0]?.id);
  return firstAllocationId || null;
},

extractId(idString) {
  if (!idString) return null;

  // Handle GID format
  const gidMatch = idString.toString().match(/gid:\/\/shopify\/\w+\/(\d+)/);
  if (gidMatch) {
    return gidMatch[1];
  }

  // Handle numeric string
  return idString.toString().split('/').pop();
},

normalizeSelectionKey(variantId) {
  const normalized = this.extractId(variantId);
  if (normalized == null) return '';
  return String(normalized);
},

getSelectedQuantity(stepIndex, variantId) {
  const selectedProducts = this.selectedProducts[stepIndex] || {};
  const normalized = this.normalizeSelectionKey(variantId);
  if (!normalized) return 0;

  if (Object.prototype.hasOwnProperty.call(selectedProducts, normalized)) {
    return Number(selectedProducts[normalized]) || 0;
  }

  const alias = Object.entries(selectedProducts).find(([productId]) =>
    this.normalizeSelectionKey(productId) === normalized
  );
  return alias ? Number(alias[1]) || 0 : 0;
},

setSelectedQuantity(stepIndex, variantId, quantity) {
  const selectedProducts = this.selectedProducts[stepIndex];
  if (!selectedProducts) return;

  const normalized = this.normalizeSelectionKey(variantId);
  if (!normalized) return;

  Object.keys(selectedProducts).forEach((productId) => {
    if (this.normalizeSelectionKey(productId) === normalized) {
      delete selectedProducts[productId];
    }
  });

  if (quantity > 0) {
    selectedProducts[normalized] = quantity;
  }

  this._persistSessionSelections?.();
},

getAddonLineDiscount(step) {
  const tier = this.getAddonTierEvaluation(step).tier;
  const discount = step?.addonDiscount || tier?.discount || {};
  const type = String(discount.type || '').toUpperCase();
  const value = Number(discount.value || 0);
  if (type !== 'PERCENTAGE' || !Number.isFinite(value) || value <= 0) return null;
  return {
    type,
    value: Math.min(100, value),
    tierId: tier?.tierId || null,
  };
},

getAddonTiers(step) {
  return Array.isArray(step?.addonTiers) ? step.addonTiers.filter(Boolean) : [];
},

getAddonTierEvaluation(step) {
  const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );
  const directTier = step?.addonEligibilityCondition || step?.addonDiscount
    ? [{
        eligibilityCondition: step?.addonEligibilityCondition || {},
        discount: step?.addonDiscount || {},
        tierId: null,
      }]
    : [];
  const tiers = this.getAddonTiers(step);
  const candidates = tiers.length > 0 ? tiers : directTier;
  if (candidates.length === 0) {
    return { tier: null, totalPrice, totalQuantity, currentValue: totalQuantity, tierIndex: -1, isEligible: false };
  }

  const withState = candidates.map((candidate, index) => {
    const condition = candidate?.eligibilityCondition || {};
    const conditionType = String(condition.type || 'QUANTITY').toUpperCase();
    const conditionValue = Number(condition.value || 0);
    const threshold = conditionType === 'AMOUNT' ? Math.round(conditionValue * 100) : conditionValue;
    const currentValue = conditionType === 'AMOUNT' ? totalPrice : totalQuantity;
    return {
      tier: candidate,
      tierIndex: index,
      conditionType,
      threshold,
      currentValue,
      isEligible: currentValue >= threshold,
    };
  });

  const eligible = withState.filter(candidate => candidate.isEligible)
    .sort((a, b) => (a.threshold - b.threshold) || (a.tierIndex - b.tierIndex));
  const next = withState
    .filter(candidate => !candidate.isEligible)
    .sort((a, b) => (a.threshold - b.threshold) || (a.tierIndex - b.tierIndex));
  const selected = eligible[eligible.length - 1] || next[0] || withState[0];

  return {
    tier: selected?.tier || null,
    tierIndex: selected?.tierIndex ?? -1,
    isEligible: selected?.isEligible === true,
    totalPrice,
    totalQuantity,
    currentValue: selected?.currentValue ?? totalQuantity,
  };
},

getAddonProductSelectionKeys(step) {
  const keys = new Set();
  const addKey = (value) => {
    if (value === null || value === undefined || value === '') return;
    const normalized = this.extractId(value) || value;
    keys.add(String(normalized));
  };
  const products = [
    ...(Array.isArray(step?.StepProduct) ? step.StepProduct : []),
    ...(Array.isArray(step?.products) ? step.products : []),
    ...(Array.isArray(step?.productsData1?.products) ? step.productsData1.products : []),
  ];

  products.forEach(product => {
    addKey(product.id);
    addKey(product.productId);
    addKey(product.graphqlId);
    addKey(product.variantId);
    addKey(product.variantGraphqlId);
    addKey(product.title);
    (Array.isArray(product.variants) ? product.variants : []).forEach(variant => {
      addKey(variant.id);
      addKey(variant.variantId);
      addKey(variant.variantGraphqlId);
      addKey(variant.admin_graphql_api_id);
      addKey(variant.title);
    });
  });

  return keys;
},

calculateSelectedAddonDiscountAmount() {
  const steps = this.selectedBundle?.steps || [];
  const chargeableAddonStep = steps.find(candidate => candidate?.isFreeGift === true && candidate?.addonDisplayFree !== true && this.getAddonLineDiscount(candidate));
  const chargeableAddonStepIndex = steps.indexOf(chargeableAddonStep);
  const chargeableAddonProductKeys = this.getAddonProductSelectionKeys(chargeableAddonStep);

  return this.getAllSelectedProductsData().reduce((total, item) => {
    const isChargeableAddonItem = Number(item.stepIndex) === chargeableAddonStepIndex || (item.isFreeGift === true && item.addonDisplayFree !== true);
    const isChargeableAddonProduct = chargeableAddonProductKeys.has(String(this.extractId(item.variantId) || item.variantId))
      || chargeableAddonProductKeys.has(String(this.extractId(item.productId) || item.productId))
      || chargeableAddonProductKeys.has(String(item.title || ''))
      || chargeableAddonProductKeys.has(String(item.parentTitle || ''));
    if (!isChargeableAddonItem && !isChargeableAddonProduct) return total;
    const step = steps[item.stepIndex];
    const addonDiscount = this.getAddonLineDiscount(step) || this.getAddonLineDiscount(chargeableAddonStep);
    if (!addonDiscount) return total;

    const selectedQuantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    if (!selectedQuantity || selectedQuantity <= 0 || !Number.isFinite(price) || price <= 0) return total;
    return total + (price * selectedQuantity * addonDiscount.value / 100);
  }, 0);
},

getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice) {
  const baseDiscountAmount = Math.max(0, Number(discountInfo?.discountAmount || 0));
  const addonDiscountAmount = this.calculateSelectedAddonDiscountAmount();
  const combinedDiscountAmount = Math.min(totalPrice, baseDiscountAmount + addonDiscountAmount);
  const finalPrice = Math.max(0, totalPrice - combinedDiscountAmount);

  return {
    ...discountInfo,
    hasDiscount: combinedDiscountAmount > 0,
    qualifiesForDiscount: combinedDiscountAmount > 0,
    discountAmount: combinedDiscountAmount,
    savings: combinedDiscountAmount,
    addonDiscountAmount,
    finalPrice,
    discountPercentage: totalPrice > 0 ? (combinedDiscountAmount / totalPrice) * 100 : 0,
  };
},

getAllSelectedProductsData() {
  const allProducts = [];

  this.selectedBundle.steps.forEach((step, stepIndex) => {
    const stepSelections = this.selectedProducts[stepIndex] || {};
    const productsInStep = this.stepProductData[stepIndex] || [];

    Object.entries(stepSelections).forEach(([variantId, quantity]) => {
      if (quantity > 0) {
        const normalizedVariantId = this.normalizeSelectionKey(variantId);
        let product = this.findProductBySelectionKey(productsInStep, normalizedVariantId);
        if (!product && normalizedVariantId) {
          product = this.findProductBySelectionKey(productsInStep, variantId);
        }

        let matchedVariant = null;
        if (!product) {
          for (const p of productsInStep) {
            if (p.variants && Array.isArray(p.variants)) {
              const variant = p.variants.find(v =>
                this.normalizeSelectionKey(v.id) === normalizedVariantId
                || String(v.id) === String(variantId)
              );
              if (variant) {
                product = p;
                matchedVariant = variant;
                break;
              }
            }
          }
        }

        if (product) {
          const variantData = matchedVariant || product;
          const isVariantMatch = !!matchedVariant;
          const variantTitle = isVariantMatch && matchedVariant.title && matchedVariant.title !== 'Default Title'
            ? matchedVariant.title
            : (product.variantTitle && product.variantTitle !== 'Default Title' ? product.variantTitle : '');
          const imageUrl = isVariantMatch
            ? (matchedVariant.image?.src || matchedVariant.image || product.imageUrl || product.image?.src || '')
            : (product.imageUrl || product.image?.src || '');
          const price = isVariantMatch
            ? (typeof variantData.price === 'number' ? variantData.price : (parseFloat(variantData.price || '0') * 100))
            : (product.price || 0);

          allProducts.push({
            stepIndex,
            variantId,
            quantity,
            title: isVariantMatch
              ? (variantTitle ? `${product.title} - ${variantTitle}` : product.title)
              : (product.title || 'Untitled Product'),
            parentTitle: product.parentTitle || product.title || 'Untitled Product',
            variantTitle,
            imageUrl,
            image: imageUrl,
            price,
            productId: product.productId || product.id,
            isDefault: step.isDefault ?? false,
            isFreeGift: step.isFreeGift ?? false,
            addonDisplayFree: step.addonDisplayFree === true,
          });
        }
      }
    });
  });

  return allProducts;
},

// Expand products with multiple variants into separate product entries
// Each variant becomes its own card showing "Product Title - Variant Name"
// This matches the full-page widget behavior for consistent UX
expandProductsByVariant(products) {
  return products.flatMap(product => {
    // If product already has a parentProductId, it was already expanded
    if (product.parentProductId && product.variantId) {
      return [product];
    }

    // If product has multiple variants, expand into separate cards
    if (product.variants && product.variants.length > 1) {
      return product.variants
        .filter(variant => variant.available !== false) // Only show available variants
        .map(variant => {
          // Use variant image if available, fallback to product image
          const imageUrl = variant.image?.src || variant.image || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

          return {
            ...product,
            id: variant.id,
            title: variant.title === 'Default Title' ? product.title : `${product.title} - ${variant.title}`,
            variantTitle: variant.title === 'Default Title' ? '' : variant.title,
            imageUrl,
            price: typeof variant.price === 'number' ? variant.price : (parseFloat(variant.price || '0') * 100),
            compareAtPrice: variant.compareAtPrice ? (typeof variant.compareAtPrice === 'number' ? variant.compareAtPrice : parseFloat(variant.compareAtPrice) * 100) : null,
            variantId: variant.id,
            available: variant.available !== false,
            parentProductId: product.id,
            parentTitle: product.title,
            // Remove variants array from individual cards to prevent showing variant selector
            variants: null
          };
        });
    }

    // Single variant or no variants - return as-is
    return [product];
  });
}
};
