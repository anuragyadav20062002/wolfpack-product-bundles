import {
  BUNDLE_WIDGET,
  CurrencyManager,
  BundleDataManager,
  PricingCalculator,
  ToastManager,
  TemplateManager,
  ComponentGenerator
} from '../../../bundle-widget-components.js';
import { ConditionValidator } from '../../shared/condition-validator.js';
import { createDefaultLoadingAnimation } from '../../shared/default-loading-animation.js';
import { hideLoadingOverlayElement, markLoadingOverlayVisible } from '../../shared/loading-overlay.js';
import { getDiscountProgressData, getSelectedQuantity, getTimelineEntryState } from '../../shared/engine/bundle-selectors.js';
import { renderDiscountProgress } from '../../shared/components/discount-progress.js';
import { createBundleBannerElement, createStepBannerImageElement } from '../../shared/components/bundle-banners.js';
import { renderSharedProductCard } from '../../shared/components/product-card.js';
import { renderSelectedProductRow } from '../../shared/components/selected-product-row.js';
import { renderSelectedProductSlots } from '../../shared/components/selected-product-slots.js';
import { renderStepTimelineEntry } from '../../shared/components/step-timeline.js';
import {
  buildCartLineDisplayProperties,
  buildCartLineSourceProperties,
} from '../../shared/engine/cart-lines.js';

function extractFullPageId(idString) {
  if (!idString) return null;
  const gidMatch = idString.toString().match(/gid:\/\/shopify\/\w+\/(\d+)/);
  if (gidMatch) return gidMatch[1];
  return idString.toString().split('/').pop();
}

export function normalizeFullPageDirectDefaultProduct(product) {
  const variant = Array.isArray(product?.variants) ? product.variants[0] : null;
  const variantId = extractFullPageId(variant?.variantGraphqlId || variant?.variantId || variant?.id);
  if (!variantId) return null;

  const imageUrl = product.images?.[0]?.originalSrc
    || product.images?.[0]?.url
    || product.imageUrl
    || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
  const inventoryQuantity = typeof variant?.inventoryQuantity === 'number'
    ? variant.inventoryQuantity
    : null;
  const price = Number.parseFloat(variant?.price || product?.price || '0') * 100;
  const requiredQuantity = Number(product.requiredQuantity || 1) || 1;
  const explicitlyUnavailable = variant?.availableForSale === false || variant?.available === false;
  const available = !explicitlyUnavailable;
  const quantityAvailable = available && inventoryQuantity === 0 ? null : inventoryQuantity;

  return {
    id: extractFullPageId(product.graphqlId || product.productId) || product.productId || variantId,
    title: product.title || '',
    handle: product.handle || '',
    imageUrl,
    price,
    compareAtPrice: null,
    variantId,
    available,
    quantityAvailable,
    currentlyNotInStock: false,
    defaultRequiredQuantity: requiredQuantity,
    isDirectDefaultProduct: true,
    variants: [{
      id: variantId,
      title: variant?.title || variant?.variantTitle || '',
      price,
      compareAtPrice: null,
      available,
      quantityAvailable,
      currentlyNotInStock: false,
    }],
    images: imageUrl ? [{ src: imageUrl }] : [],
    description: '',
  };
}

export const fullPageProductProcessingMethods = {
async loadStepProducts(stepIndex) {
  const step = this.selectedBundle.steps[stepIndex];

  if (this.stepProductData[stepIndex].length > 0) {
    return;
  }


  let allProducts = [];

  if (step?.isFreeGift && Array.isArray(step.addonTiers)) {
    const evaluation = typeof this.getAddonTierEvaluation === 'function'
      ? this.getAddonTierEvaluation(step)
      : { tier: null, isEligible: false };
    const activeTier = evaluation?.isEligible === true ? evaluation.tier : null;
    const activeProducts = Array.isArray(activeTier?.selectedAddonProducts)
      ? activeTier.selectedAddonProducts
      : [];
    allProducts = activeProducts.map(product =>
      typeof this.normalizePersonalizationAddonProduct === 'function'
        ? this.normalizePersonalizationAddonProduct(product)
        : product
    );
    step.displayVariantsAsIndividual = activeTier?.displayVariantsAsIndividualProducts_addons === true;
    const activeDiscount = activeTier?.discount || {};
    step.addonDisplayFree = activeDiscount.type === 'PERCENTAGE' && Number(activeDiscount.value || 0) >= 100;
  }

  // Process explicit products.
  // When loaded from metafield cache (data-bundle-config), step.products already contains
  // full enriched data (images, variants, prices) — use directly, no API call needed.
  // When loaded from the API response, step.StepProduct carries the enriched data and
  // step.products only has stubs, so skip the fetch to avoid a duplicate call.
  const hasEnrichedStepProducts = !step?.isFreeGift && Array.isArray(step.StepProduct) && step.StepProduct.length > 0
    && step.StepProduct.some(sp => sp.title && sp.imageUrl);

  const stepProductsAlreadyEnriched = !step?.isFreeGift && Array.isArray(step.products) && step.products.length > 0
    && step.products.some(p => (Array.isArray(p.images) && p.images.length > 0) || p.featuredImage);

  if (stepProductsAlreadyEnriched) {
    // Metafield cache path: products have full data, use them directly.
    // Prices in metafield are stored as cents (e.g. 82900 = ₹829.00).
    // processProductsForStep multiplies by 100 assuming decimal input, so
    // divide by 100 here to normalise before that multiplication.
    const normalizedProducts = step.products.map(p => ({
      ...p,
      price: (p.price || 0) / 100,
      compareAtPrice: p.compareAtPrice ? p.compareAtPrice / 100 : null,
      variants: p.variants?.map(v => ({
        ...v,
        price: (v.price || 0) / 100,
        compareAtPrice: v.compareAtPrice ? v.compareAtPrice / 100 : null,
      }))
    }));
    allProducts = allProducts.concat(normalizedProducts);
  } else if (!step?.isFreeGift) {
    const productIds = this.collectStepProductIds(step);
    if (!hasEnrichedStepProducts && productIds.length > 0) {
      const shop = window.Shopify?.shop || window.location.host;

      // Get app URL from widget data attribute or window global
      const apiBaseUrl = this.resolveStorefrontApiBase();

      // Derive customer's country for @inContext pricing (market-correct prices via Shopify Markets)
      const country = window.Shopify?.country
        || (window.Shopify?.locale?.includes('-') ? window.Shopify.locale.split('-')[1] : null)
        || null;

      try {
        const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
        const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productIds.join(','))}&shop=${encodeURIComponent(shop)}${countryParam}`);

        if (!response.ok) {
          await response.text();
        } else {
          const data = await response.json();

          if (data.products && data.products.length > 0) {
            allProducts = allProducts.concat(data.products);
          }
        }
      } catch (error) {
      }
    }
  }

  if (!step?.isFreeGift && allProducts.length === 0 && Array.isArray(step.categories)) {
    const hasRenderableCachedProductData = (product) => Boolean(
      product
      && typeof product === 'object'
      && (
        (Array.isArray(product.variants) && product.variants.length > 0)
        || (Array.isArray(product.images) && product.images.length > 0)
        || product.imageUrl
        || product.featuredImage
        || product.price
      )
    );

    step.categories.forEach(category => {
      (category.products || []).forEach(product => {
        if (hasRenderableCachedProductData(product)) allProducts.push(product);
      });
      (category.selectedProducts || []).forEach(product => {
        if (hasRenderableCachedProductData(product)) allProducts.push(product);
      });
    });
  }

  if (!step?.isFreeGift && step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {
    // Check if StepProduct already has enriched data (for full-page bundles)
    const hasEnrichedData = step.StepProduct.some(sp => sp.title && sp.imageUrl && sp.price);

    if (hasEnrichedData) {

      // Transform StepProduct to match expected product format
      const enrichedProducts = step.StepProduct.map(sp => ({
        id: sp.productId,
        title: sp.title,
        handle: sp.handle,
        imageUrl: sp.imageUrl,
        price: sp.price,
        compareAtPrice: sp.compareAtPrice,
        available: true,
        variants: sp.variants || [{
          id: sp.productId.replace('Product', 'ProductVariant'),
          title: 'Default Title',
          price: sp.price,
          compareAtPrice: sp.compareAtPrice,
          available: true,
          image: sp.imageUrl ? { src: sp.imageUrl } : null
        }]
      }));

      allProducts = allProducts.concat(enrichedProducts);
    } else {
      // Fetch from storefront API if data is not enriched
      const productGids = step.StepProduct.map(sp => sp.productId).filter(Boolean);
      const shop = window.Shopify?.shop || window.location.host;

      if (productGids.length > 0) {

        const apiBaseUrl = this.resolveStorefrontApiBase();

        // Derive customer's country for @inContext pricing (market-correct prices via Shopify Markets)
        const country = window.Shopify?.country
          || (window.Shopify?.locale?.includes('-') ? window.Shopify.locale.split('-')[1] : null)
          || null;

        try {
          const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
          const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productGids.join(','))}&shop=${encodeURIComponent(shop)}${countryParam}`);

          if (!response.ok) {
          } else {
            const data = await response.json();
            if (data.products && data.products.length > 0) {
              allProducts = allProducts.concat(data.products);
            }
          }
        } catch (error) {
        }
      }
    }
  }

  const collectionHandles = step?.isFreeGift ? [] : this.collectStepCollectionHandles(step);
  if (collectionHandles.length > 0) {
    const shop = window.Shopify?.shop || window.location.host;
    const apiBaseUrl = this.resolveStorefrontApiBase();


    try {
      const response = await fetch(
        `${apiBaseUrl}/api/storefront-collections?handles=${encodeURIComponent(collectionHandles.join(','))}&shop=${encodeURIComponent(shop)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.products && data.products.length > 0) {
          allProducts = allProducts.concat(data.products);
        }
        // Store per-collection product ID membership for tab filtering
        if (data.byCollection) {
          for (const [handle, productIds] of Object.entries(data.byCollection)) {
            this.stepCollectionProductIds[`${stepIndex}:${handle}`] = productIds;
          }
        }
      } else {
      }
    } catch (error) {
    }
  }

  // Process and normalize product data

  const processedProducts = this._mergeDirectDefaultProductsIntoStep(
    stepIndex,
    this.processProductsForStep(allProducts, step),
  );


  // Remove duplicates
  const seen = new Set();
  this.stepProductData[stepIndex] = processedProducts.filter(product => {
    const key = product.variantId || product.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

},

_getDirectDefaultProductsData() {
  const data = this.selectedBundle?.defaultProductsData;
  if (!data || data.isDefaultProductsEnabled !== true || !Array.isArray(data.products)) {
    return null;
  }
  return data;
},

_getDirectDefaultProductItems() {
  const data = this._getDirectDefaultProductsData();
  if (!data) return [];
  return data.products
    .map(product => normalizeFullPageDirectDefaultProduct(product))
    .filter(Boolean);
},

_initDirectDefaultProducts() {
  this.directDefaultProducts = this._getDirectDefaultProductItems();
  if (this.directDefaultProducts.length === 0 || !this.selectedProducts[0]) return;

  this.directDefaultProducts.forEach(product => {
    this.selectedProducts[0][product.variantId] = product.defaultRequiredQuantity || 1;
  });
},

_mergeDirectDefaultProductsIntoStep(stepIndex, products) {
  if (stepIndex !== 0 || !Array.isArray(this.directDefaultProducts) || this.directDefaultProducts.length === 0) {
    return products;
  }

  const directDefaultsByVariant = new Map(
    this.directDefaultProducts
      .filter(product => product?.variantId)
      .map(product => [String(product.variantId), product])
  );
  const seenDirectDefaults = new Set();
  const mergedProducts = products.map(product => {
    const key = String(product?.variantId || product?.id || '');
    const directDefault = directDefaultsByVariant.get(key);
    if (!directDefault) return product;

    seenDirectDefaults.add(key);
    return {
      ...product,
      defaultRequiredQuantity: directDefault.defaultRequiredQuantity,
      isDirectDefaultProduct: true,
    };
  });

  const unmatchedDirectDefaults = this.directDefaultProducts.filter(product => {
    const key = String(product?.variantId || '');
    return key && !seenDirectDefaults.has(key);
  });

  return mergedProducts.concat(unmatchedDirectDefaults);
},

_getDirectDefaultSelectionQuantities(stepIndex) {
  if (stepIndex !== 0 || !Array.isArray(this.directDefaultProducts)) return {};
  return this.directDefaultProducts.reduce((quantities, product) => {
    if (product?.variantId) {
      quantities[String(product.variantId)] = product.defaultRequiredQuantity || 1;
    }
    return quantities;
  }, {});
},

_getStepConditionSelections(stepIndex, selections = this.selectedProducts?.[stepIndex] || {}) {
  const directDefaults = this._getDirectDefaultSelectionQuantities(stepIndex);
  if (Object.keys(directDefaults).length === 0) return selections;

  return Object.entries(selections || {}).reduce((filtered, [variantId, quantity]) => {
    const directDefaultQuantity = Number(directDefaults[String(variantId)] || 0);
    const conditionQuantity = Math.max(0, Number(quantity || 0) - directDefaultQuantity);
    if (conditionQuantity > 0) filtered[variantId] = conditionQuantity;
    return filtered;
  }, {});
},

shouldExpandStepProductsDuringLoad(step) {
  const hasCategoryProducts = Array.isArray(step?.categories) && step.categories.some(category =>
    (Array.isArray(category.products) && category.products.length > 0)
    || (Array.isArray(category.selectedProducts) && category.selectedProducts.length > 0)
    || (Array.isArray(category.collections) && category.collections.length > 0)
    || (Array.isArray(category.collectionsData) && category.collectionsData.length > 0)
    || (Array.isArray(category.collectionsSelectedData) && category.collectionsSelectedData.length > 0)
  );

  if (hasCategoryProducts) {
    return false;
  }

  return step?.displayVariantsAsIndividualProducts === true || step?.displayVariantsAsIndividual === true;
},

getFirstAvailableVariant(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (variants.length === 0) {
    return null;
  }

  return variants.find(variant => variant.available === true) || null;
},

processProductsForStep(products, step) {
  // Normalize per-variant inventory fields from the Storefront API proxy response.
  // quantityAvailable is number | null (null when the inventory scope isn't granted
  // or the variant is untracked — widget treats null as unlimited).
  // currentlyNotInStock is true for backorder-accepting variants that are sold out.
  const normalizeVariant = (v) => ({
    id: this.extractId(v.id),
    title: v.title,
    price: parseFloat(v.price || '0') * 100,
    compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) * 100 : null,
    sellingPlanAllocations: Array.isArray(v.sellingPlanAllocations)
      ? v.sellingPlanAllocations
      : [],
    available: v.available === true,
    quantityAvailable: typeof v.quantityAvailable === 'number' ? v.quantityAvailable : null,
    currentlyNotInStock: v.currentlyNotInStock === true,
    option1: v.option1 || null,
    option2: v.option2 || null,
    option3: v.option3 || null,
    image: v.image || null
  });

  return products.flatMap(product => {
    if (this.shouldExpandStepProductsDuringLoad(step) && product.variants && product.variants.length > 0) {
      // Display each variant as separate product - filter out unavailable variants
      // Preserve parent product reference for variant selection in modal
      const processedVariants = (product.variants || []).map(normalizeVariant);

      const processedOptions = (product.options || []).map(opt => {
        if (typeof opt === 'string') return opt;
        return opt.name || opt;
      });

      return product.variants
        .filter(variant => variant.available === true) // Only show available variants
        .map(variant => {
          // Storefront API: prioritize variant image, fallback to product featured image.
          // product.imageUrl — set by API path; product.featuredImage/images — metafield cache format.
          const imageUrl = variant?.image?.src
            || variant?.image?.url
            || (typeof variant?.image === 'string' ? variant.image : null)
            || variant?.imageUrl
            || product.imageUrl
            || product.featuredImage?.url
            || product.images?.[0]?.url
            || product.images?.[0]?.src
            || product.images?.[0]?.originalSrc
            || 'https://via.placeholder.com/150';

          return {
            id: this.extractId(variant.id),
            title: `${product.title} - ${variant.title}`,
            imageUrl,
            price: parseFloat(variant.price || '0') * 100,
            compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) * 100 : null,
            variantId: this.extractId(variant.id),
            available: variant.available === true,
            quantityAvailable: typeof variant.quantityAvailable === 'number' ? variant.quantityAvailable : null,
            currentlyNotInStock: variant.currentlyNotInStock === true,
            sellingPlanAllocations: variant.sellingPlanAllocations || [],
            // Preserve parent product data for variant selection in modal
            parentProductId: this.extractId(product.id),
            parentTitle: product.title,
            variants: processedVariants,
            options: processedOptions,
            images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
            description: product.description || ''
          };
        });
    } else {
      // Display product with default variant - check availability
      const defaultVariant = this.getFirstAvailableVariant(product);

      if (product.variants?.length > 0 && !defaultVariant) {
        return [];
      }

      // Storefront API: prioritize variant image, fallback to product featured image.
      // product.imageUrl — set by API path; product.featuredImage/images — metafield cache format.
      const imageUrl = defaultVariant?.image?.src
        || defaultVariant?.image?.url
        || (typeof defaultVariant?.image === 'string' ? defaultVariant.image : null)
        || defaultVariant?.imageUrl
        || product.imageUrl
        || product.featuredImage?.url
        || product.images?.[0]?.url
        || product.images?.[0]?.src
        || product.images?.[0]?.originalSrc
        || 'https://via.placeholder.com/150';

      // Process variants array for variant selection in modal
      const processedVariants = (product.variants || []).map(normalizeVariant);

      // Process options array for variant selector labels
      const processedOptions = (product.options || []).map(opt => {
        if (typeof opt === 'string') return opt;
        return opt.name || opt;
      });

      return [{
        id: this.extractId(product.id),
        title: product.title,
        imageUrl,
        price: defaultVariant ? parseFloat(defaultVariant.price || '0') * 100 : 0,
        compareAtPrice: defaultVariant?.compareAtPrice ? parseFloat(defaultVariant.compareAtPrice) * 100 : null,
        variantId: this.extractId(defaultVariant?.id || product.id),
        sellingPlanAllocations: defaultVariant?.sellingPlanAllocations || [],
        available: defaultVariant?.available === true,
        quantityAvailable: typeof defaultVariant?.quantityAvailable === 'number' ? defaultVariant.quantityAvailable : null,
        currentlyNotInStock: defaultVariant?.currentlyNotInStock === true,
        // Preserve variants and options for variant selection in modal
        variants: processedVariants,
        options: processedOptions,
        // Preserve the first image candidates for the product details modal.
        images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
        description: product.description || ''
      }];
    }
  });
},

/**
 * Look up real stock for a variant in a step's product data.
 * Returns:
 *   - available: positive numeric remaining stock, or null when uncapped
 *   - outOfStock: true only when Shopify marks the variant unavailable
 *   - acceptsBackorder: true when Shopify marks the variant as backorderable
 */
isVariantOutOfStock(product) {
  if (!product) {
    return false;
  }
  if (product.available === false) {
    return true;
  }
  return false;
},

getVariantAvailable(stepIndex, variantId) {
  const products = this.stepProductData[stepIndex] || [];
  const product = products.find(p => (p.variantId || p.id) === variantId);
  if (!product) {
    return { available: null, outOfStock: false, acceptsBackorder: false };
  }

  const qty = typeof product.quantityAvailable === 'number' && product.quantityAvailable > 0
    ? product.quantityAvailable
    : null;
  const backorder = product.currentlyNotInStock === true;
  const outOfStock = this.isVariantOutOfStock(product);

  return { available: qty, outOfStock, acceptsBackorder: backorder };
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
};
