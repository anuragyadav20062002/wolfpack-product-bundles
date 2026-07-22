import {
  BUNDLE_WIDGET,
} from '../../../bundle-widget-components.js';

function extractFullPageId(idString) {
  if (!idString) return null;
  const gidMatch = idString.toString().match(/gid:\/\/shopify\/\w+\/(\d+)/);
  if (gidMatch) return gidMatch[1];
  return idString.toString().split('/').pop();
}

function normalizeAddonPercentageDiscount(discount, tier = null) {
  const type = String(discount?.type ?? tier?.discountType ?? '').toUpperCase();
  const value = Number(discount?.value ?? tier?.discountValue ?? 0);
  if (type !== 'PERCENTAGE' || !Number.isFinite(value) || value <= 0) return null;
  return { type: 'PERCENTAGE', value: Math.min(100, value) };
}

function collectProductSelectionKeys(product) {
  const keys = new Set();
  const addKey = (value) => {
    if (value === null || value === undefined || value === '') return;
    const normalized = extractFullPageId(value) || value;
    keys.add(String(normalized));
  };

  addKey(product?.id);
  addKey(product?.productId);
  addKey(product?.graphqlId);
  addKey(product?.variantId);
  addKey(product?.variantGraphqlId);
  (Array.isArray(product?.variants) ? product.variants : []).forEach(variant => {
    addKey(variant?.id);
    addKey(variant?.variantId);
    addKey(variant?.variantGraphqlId);
    addKey(variant?.admin_graphql_api_id);
  });

  return keys;
}

function pruneStepSelectionsToProducts(selectedProducts, stepIndex, products) {
  const selections = selectedProducts?.[stepIndex];
  if (!selections) return;

  const allowedKeys = new Set();
  products.forEach(product => {
    collectProductSelectionKeys(product).forEach(key => allowedKeys.add(key));
  });

  Object.keys(selections).forEach(key => {
    if (!allowedKeys.has(String(key))) {
      delete selections[key];
    }
  });
}

function normalizeWeightToGrams(weight, unit) {
  const numeric = Number(weight);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;

  switch (String(unit || '').toUpperCase()) {
    case 'KILOGRAMS':
    case 'KILOGRAM':
    case 'KG':
      return numeric * 1000;
    case 'POUNDS':
    case 'POUND':
    case 'LB':
    case 'LBS':
      return numeric * 453.59237;
    case 'OUNCES':
    case 'OUNCE':
    case 'OZ':
      return numeric * 28.349523125;
    case 'GRAMS':
    case 'GRAM':
    case 'G':
    default:
      return numeric;
  }
}

function isTrackedZeroStock(product) {
  return product?.quantityAvailable === 0 && product?.currentlyNotInStock !== true;
}

function getVariantSelectedOptionValue(variant, index) {
  const directValue = variant?.[`option${index}`];
  if (directValue) return directValue;

  const selectedOptions = Array.isArray(variant?.selectedOptions) ? variant.selectedOptions : [];
  const selectedOption = selectedOptions[index - 1];
  if (selectedOption?.value) return selectedOption.value;

  const titleParts = typeof variant?.title === 'string'
    ? variant.title.split(' / ').map(part => part.trim()).filter(Boolean)
    : [];
  return titleParts[index - 1] || null;
}

function deriveProductOptionNames(product) {
  const explicitOptions = (Array.isArray(product?.options) ? product.options : [])
    .map(option => {
      if (typeof option === 'string') return option;
      return option?.name || option;
    })
    .filter(Boolean);
  if (explicitOptions.length > 0) return explicitOptions;

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const optionNames = [];
  variants.forEach(variant => {
    const selectedOptions = Array.isArray(variant?.selectedOptions) ? variant.selectedOptions : [];
    selectedOptions.forEach((option, index) => {
      if (!optionNames[index] && option?.name) optionNames[index] = option.name;
    });
  });
  if (optionNames.filter(Boolean).length > 0) return optionNames.filter(Boolean);

  const maxTitleParts = variants.reduce((max, variant) => {
    if (typeof variant?.title !== 'string' || variant.title === 'Default Title') return max;
    return Math.max(max, variant.title.split(' / ').filter(Boolean).length);
  }, 0);

  return Array.from({ length: maxTitleParts }, (_, index) => `Option ${index + 1}`);
}

function normalizeProductDescription(product) {
  const directDescription = typeof product?.description === 'string'
    ? product.description.trim()
    : '';
  if (directDescription) return directDescription;

  const htmlDescription = typeof product?.descriptionHtml === 'string'
    ? product.descriptionHtml.trim()
    : '';
  if (!htmlDescription || typeof document === 'undefined') return '';

  const scratch = document.createElement('div');
  scratch.innerHTML = htmlDescription;
  return (scratch.textContent || '').trim();
}

function normalizeProductDescriptionHtml(product) {
  return typeof product?.descriptionHtml === 'string'
    ? product.descriptionHtml.trim()
    : '';
}

function collectCategoryProducts(step) {
  if (!Array.isArray(step?.categories)) return [];

  const products = [];
  step.categories.forEach(category => {
    if (!category || typeof category !== 'object') return;
    if (Array.isArray(category.products)) products.push(...category.products);
    if (Array.isArray(category.selectedProducts)) products.push(...category.selectedProducts);
  });
  return products;
}

function productLookupKey(product) {
  return extractFullPageId(product?.id || product?.productId || product?.graphqlId);
}

function productGraphqlId(product) {
  const rawId = product?.graphqlId || product?.productId || product?.id;
  if (!rawId) return null;
  const normalized = String(rawId);
  if (normalized.startsWith('gid://shopify/Product/')) return normalized;
  if (/^\d+$/.test(normalized)) return `gid://shopify/Product/${normalized}`;
  return null;
}

function hasCompleteRuntimeProductData(product) {
  if (!product || typeof product !== 'object') return false;
  const price = Number(product.price);
  const variants = Array.isArray(product.variants) ? product.variants : [];
  return Number.isFinite(price) && price > 0 && variants.length > 0;
}

function normalizeCachedRuntimeProduct(product) {
  return {
    ...product,
    price: (product.price || 0) / 100,
    compareAtPrice: product.compareAtPrice ? product.compareAtPrice / 100 : null,
    variants: product.variants?.map(variant => ({
      ...variant,
      price: (variant.price || 0) / 100,
      compareAtPrice: variant.compareAtPrice ? variant.compareAtPrice / 100 : null,
    }))
  };
}

function variantLookupKey(variant) {
  return extractFullPageId(
    variant?.id
    || variant?.variantId
    || variant?.variantGraphqlId
    || variant?.graphqlId
    || variant?.admin_graphql_api_id
  );
}

function mergeVariantRuntimeAvailability(product, categoryProduct) {
  if (!Array.isArray(product?.variants) || !Array.isArray(categoryProduct?.variants)) return product;

  const categoryVariantsById = new Map();
  categoryProduct.variants.forEach(variant => {
    const key = variantLookupKey(variant);
    if (key) categoryVariantsById.set(key, variant);
  });
  if (categoryVariantsById.size === 0) return product;

  let changed = false;
  const variants = product.variants.map(variant => {
    const source = categoryVariantsById.get(variantLookupKey(variant));
    if (!source) return variant;

    const patch = {};
    if (source.available === true || source.available === false) patch.available = source.available;
    if (typeof source.quantityAvailable === 'number') patch.quantityAvailable = source.quantityAvailable;
    if (source.currentlyNotInStock === true || source.currentlyNotInStock === false) {
      patch.currentlyNotInStock = source.currentlyNotInStock;
    }
    if (Object.keys(patch).length === 0) return variant;

    changed = true;
    return { ...variant, ...patch };
  });

  if (!changed) return product;
  return {
    ...product,
    variants,
    available: variants.some(variant => variant.available !== false),
  };
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
  const quantityAvailable = inventoryQuantity;

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
    description: normalizeProductDescription(product),
    descriptionHtml: normalizeProductDescriptionHtml(product),
  };
}

export const fullPageProductProcessingMethods = {
mergeCategoryProductVariantAvailability(products, step) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const categoryProductsByKey = new Map();
  collectCategoryProducts(step).forEach(product => {
    const key = productLookupKey(product);
    if (key && !categoryProductsByKey.has(key)) categoryProductsByKey.set(key, product);
  });
  if (categoryProductsByKey.size === 0) return products;

  return products.map(product => {
    const key = productLookupKey(product);
    const categoryProduct = key ? categoryProductsByKey.get(key) : null;
    return categoryProduct ? mergeVariantRuntimeAvailability(product, categoryProduct) : product;
  });
},

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
    step.StepProduct = allProducts;
    step.products = allProducts;
    step.maxQuantity = allProducts.length;
    step.displayVariantsAsIndividual = activeTier?.displayVariantsAsIndividualProducts_addons === true;
    const activeDiscount = normalizeAddonPercentageDiscount(activeTier?.discount, activeTier);
    step.addonDisplayFree = activeDiscount?.value >= 100;
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
  const shouldRefreshRuntimeInventory = hasEnrichedStepProducts
    && fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled.call(this);
  const refreshedProductKeys = new Set();
  const productIds = !step?.isFreeGift ? this.collectStepProductIds(step) : [];
  if (!step?.isFreeGift && Array.isArray(step.StepProduct)) {
    step.StepProduct.forEach(product => {
      const id = product?.productId || product?.graphqlId || product?.id;
      if (id && !productIds.includes(id)) productIds.push(id);
    });
  }

  if (stepProductsAlreadyEnriched) {
    // Metafield cache path: products have full data, use them directly.
    // Prices in metafield are stored as cents (e.g. 82900 = ₹829.00).
    // processProductsForStep multiplies by 100 assuming decimal input, so
    // divide by 100 here to normalise before that multiplication.
    const cachedProducts = [];
    const incompleteProducts = [];
    step.products.forEach(product => {
      if (hasCompleteRuntimeProductData(product)) {
        cachedProducts.push(product);
      } else {
        incompleteProducts.push(product);
      }
    });

    const fetchedProductsByKey = new Map();
    if (incompleteProducts.length > 0) {
      const missingProductIds = incompleteProducts
        .map(productGraphqlId)
        .filter(Boolean);

      if (missingProductIds.length > 0) {
        const shop = window.Shopify?.shop || window.location.host;
        const apiBaseUrl = this.resolveStorefrontApiBase();
        const country = window.Shopify?.country
          || (window.Shopify?.locale?.includes('-') ? window.Shopify.locale.split('-')[1] : null)
          || null;

        try {
          const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
          const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(missingProductIds.join(','))}&shop=${encodeURIComponent(shop)}${countryParam}`);

          if (response.ok) {
            const data = await response.json();
            if (data.products && data.products.length > 0) {
              if (typeof this.rememberRuntimeProductInventory === 'function') {
                this.rememberRuntimeProductInventory(data.products);
              }
              data.products.forEach(product => {
                const key = productLookupKey(product);
                if (key) fetchedProductsByKey.set(key, product);
              });
            }
          } else {
            await response.text();
          }
        } catch (error) {
        }
      }
    }

    step.products.forEach(product => {
      if (cachedProducts.includes(product)) {
        allProducts.push(normalizeCachedRuntimeProduct(product));
        return;
      }

      const key = productLookupKey(product);
      const fetchedProduct = key ? fetchedProductsByKey.get(key) : null;
      if (fetchedProduct) {
        allProducts.push(fetchedProduct);
      } else {
        allProducts.push(normalizeCachedRuntimeProduct(product));
      }
    });
  } else if (!step?.isFreeGift) {
    if ((!hasEnrichedStepProducts || shouldRefreshRuntimeInventory) && productIds.length > 0) {
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
            if (typeof this.rememberRuntimeProductInventory === 'function') {
              this.rememberRuntimeProductInventory(data.products);
            }
            if (shouldRefreshRuntimeInventory) {
              data.products.forEach(product => {
                const key = productLookupKey(product);
                if (key) refreshedProductKeys.add(key);
              });
            }
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
      })).filter(product => {
        const key = productLookupKey(product);
        return !key || !refreshedProductKeys.has(key);
      });

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
              if (typeof this.rememberRuntimeProductInventory === 'function') {
                this.rememberRuntimeProductInventory(data.products);
              }
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
          if (typeof this.rememberRuntimeProductInventory === 'function') {
            this.rememberRuntimeProductInventory(data.products);
          }
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

  allProducts = await this.enrichMissingProductDescriptions(allProducts);

  // Process and normalize product data
  allProducts = this.mergeCategoryProductVariantAvailability(allProducts, step);

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

  if (step?.isFreeGift && Array.isArray(step.addonTiers)) {
    step.maxQuantity = this.stepProductData[stepIndex].length;
    pruneStepSelectionsToProducts(this.selectedProducts, stepIndex, this.stepProductData[stepIndex]);
  }

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

  return variants.find(variant => this.isVariantSelectableForInventory(variant)) || null;
},

rememberRuntimeProductInventory(products) {
  if (!Array.isArray(products) || products.length === 0) return;
  if (!this._fpbRuntimeVariantInventoryById) {
    this._fpbRuntimeVariantInventoryById = {};
  }

  products.forEach(product => {
    (Array.isArray(product?.variants) ? product.variants : []).forEach(variant => {
      const key = variantLookupKey(variant);
      if (!key) return;
      this._fpbRuntimeVariantInventoryById[key] = {
        available: variant.available === true,
        quantityAvailable: typeof variant.quantityAvailable === 'number' ? variant.quantityAvailable : null,
        currentlyNotInStock: variant.currentlyNotInStock === true,
      };
    });
  });
},

getRuntimeVariantInventory(productOrVariant) {
  const key = variantLookupKey(productOrVariant);
  if (!key) return null;
  return this._fpbRuntimeVariantInventoryById?.[key] || null;
},

isInventoryTrackingOnAddToCartEnabled() {
  const controls = typeof this._getLandingPageControls === 'function'
    ? this._getLandingPageControls()
    : null;
  return controls?.trackInventoryOnAddToCart === true;
},

isVariantSelectableForInventory(variant) {
  const runtimeInventory = typeof this.getRuntimeVariantInventory === 'function'
    ? this.getRuntimeVariantInventory(variant)
    : null;
  const candidate = runtimeInventory ? { ...variant, ...runtimeInventory } : variant;

  if (candidate?.available !== true) {
    return false;
  }
  const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
    ? this.isInventoryTrackingOnAddToCartEnabled()
    : fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled.call(this);
  if (!trackInventoryOnAddToCart) {
    return true;
  }
  return !isTrackedZeroStock(candidate);
},

processProductsForStep(products, step) {
  // Normalize per-variant inventory fields from the Storefront API proxy response.
  // quantityAvailable is number | null (null when the inventory scope isn't granted
  // or the variant is untracked — widget treats null as unlimited).
  // currentlyNotInStock is true for backorder-accepting variants that are sold out.
  const toCents = (value) => Math.round(parseFloat(value || '0') * 100);
  const normalizeVariant = (v) => {
    const quantityAvailable = typeof v.quantityAvailable === 'number' ? v.quantityAvailable : null;
    const currentlyNotInStock = v.currentlyNotInStock === true;
    return {
      id: this.extractId(v.id),
      title: v.title,
      price: toCents(v.price),
      compareAtPrice: v.compareAtPrice ? toCents(v.compareAtPrice) : null,
      sellingPlanAllocations: Array.isArray(v.sellingPlanAllocations)
        ? v.sellingPlanAllocations
        : [],
      available: v.available === true && (
        !fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled.call(this)
        || !(quantityAvailable === 0 && currentlyNotInStock !== true)
      ),
      quantityAvailable,
      currentlyNotInStock,
      weight: normalizeWeightToGrams(v.weight, v.weightUnit),
      weightUnit: 'GRAMS',
      option1: getVariantSelectedOptionValue(v, 1),
      option2: getVariantSelectedOptionValue(v, 2),
      option3: getVariantSelectedOptionValue(v, 3),
      image: v.image || null
    };
  };

  return products.flatMap(product => {
    if (this.shouldExpandStepProductsDuringLoad(step) && product.variants && product.variants.length > 0) {
      // Display each variant as separate product - filter out unavailable variants
      // Preserve parent product reference for variant selection in modal
      const processedVariants = (product.variants || []).map(normalizeVariant);

      const processedOptions = deriveProductOptionNames(product);

      return product.variants
        .filter(variant => this.isVariantSelectableForInventory(variant))
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
            || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

          return {
            id: this.extractId(variant.id),
            title: `${product.title} - ${variant.title}`,
            imageUrl,
            price: toCents(variant.price),
            compareAtPrice: variant.compareAtPrice ? toCents(variant.compareAtPrice) : null,
            variantId: this.extractId(variant.id),
            available: this.isVariantSelectableForInventory(variant),
            quantityAvailable: typeof variant.quantityAvailable === 'number' ? variant.quantityAvailable : null,
            currentlyNotInStock: variant.currentlyNotInStock === true,
            weight: normalizeWeightToGrams(variant.weight, variant.weightUnit),
            weightUnit: 'GRAMS',
            sellingPlanAllocations: variant.sellingPlanAllocations || [],
            // Preserve parent product data for variant selection in modal
            parentProductId: this.extractId(product.id),
            parentTitle: product.title,
            variants: processedVariants,
            options: processedOptions,
            images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
            description: normalizeProductDescription(product),
            descriptionHtml: normalizeProductDescriptionHtml(product)
          };
        });
    } else {
      // Grouped cards require at least one sellable variant. This also removes
      // tracked zero-stock products when the global inventory control is active.
      const defaultVariant = this.getFirstAvailableVariant(product);
      if (Array.isArray(product?.variants) && product.variants.length > 0 && !defaultVariant) {
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
        || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

      // Process variants array for variant selection in modal
      const processedVariants = (product.variants || []).map(normalizeVariant);

      // Process options array for variant selector labels
      const processedOptions = deriveProductOptionNames(product);

      return [{
        id: this.extractId(product.id),
        title: product.title,
        imageUrl,
        price: defaultVariant
          ? toCents(defaultVariant.price)
          : toCents(product.price),
        compareAtPrice: defaultVariant?.compareAtPrice ? toCents(defaultVariant.compareAtPrice) : null,
        variantId: this.extractId(defaultVariant?.id || product.id),
        sellingPlanAllocations: defaultVariant?.sellingPlanAllocations || [],
        available: defaultVariant ? this.isVariantSelectableForInventory(defaultVariant) : product.available === true,
        quantityAvailable: typeof defaultVariant?.quantityAvailable === 'number' ? defaultVariant.quantityAvailable : null,
        currentlyNotInStock: defaultVariant?.currentlyNotInStock === true,
        weight: normalizeWeightToGrams(defaultVariant?.weight, defaultVariant?.weightUnit),
        weightUnit: 'GRAMS',
        // Preserve variants and options for variant selection in modal
        variants: processedVariants,
        options: processedOptions,
        // Preserve the first image candidates for the product details modal.
        images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
        description: normalizeProductDescription(product),
        descriptionHtml: normalizeProductDescriptionHtml(product)
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
  const runtimeInventory = typeof this.getRuntimeVariantInventory === 'function'
    ? this.getRuntimeVariantInventory(product)
    : null;
  const candidate = runtimeInventory ? { ...product, ...runtimeInventory } : product;

  if (candidate.available === false) {
    return true;
  }
  const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
    ? this.isInventoryTrackingOnAddToCartEnabled()
    : fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled.call(this);
  if (trackInventoryOnAddToCart && isTrackedZeroStock(candidate)) {
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

  const runtimeInventory = typeof this.getRuntimeVariantInventory === 'function'
    ? this.getRuntimeVariantInventory(product)
    : null;
  const candidate = runtimeInventory ? { ...product, ...runtimeInventory } : product;
  const backorder = candidate.currentlyNotInStock === true;
  const outOfStock = this.isVariantOutOfStock(product);
  const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
    ? this.isInventoryTrackingOnAddToCartEnabled()
    : fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled.call(this);
  const qty = trackInventoryOnAddToCart
    && typeof candidate.quantityAvailable === 'number'
    && candidate.quantityAvailable > 0
    ? candidate.quantityAvailable
    : null;

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

async enrichMissingProductDescriptions(products) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const missingProductIds = Array.from(new Set(products
    .filter(product => !normalizeProductDescriptionHtml(product))
    .map(productGraphqlId)
    .filter(Boolean)));

  if (missingProductIds.length === 0) return products;

  const shop = window.Shopify?.shop || window.location.host;
  const apiBaseUrl = this.resolveStorefrontApiBase();
  const country = window.Shopify?.country
    || (window.Shopify?.locale?.includes('-') ? window.Shopify.locale.split('-')[1] : null)
    || null;

  try {
    const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
    const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(missingProductIds.join(','))}&shop=${encodeURIComponent(shop)}${countryParam}`);
    if (!response.ok) return products;

    const data = await response.json();
    if (typeof this.rememberRuntimeProductInventory === 'function') {
      this.rememberRuntimeProductInventory(data.products);
    }
    const descriptionsByProductId = new Map();
    (Array.isArray(data.products) ? data.products : []).forEach(product => {
      const description = normalizeProductDescription(product);
      const descriptionHtml = normalizeProductDescriptionHtml(product);
      const key = productLookupKey(product);
      if (key && (description || descriptionHtml)) {
        descriptionsByProductId.set(key, { description, descriptionHtml });
      }
    });

    if (descriptionsByProductId.size === 0) return products;

    return products.map(product => {
      if (normalizeProductDescriptionHtml(product)) return product;
      const key = productLookupKey(product);
      const descriptions = key ? descriptionsByProductId.get(key) : null;
      if (!descriptions) return product;

      const existingDescription = normalizeProductDescription(product);
      return {
        ...product,
        description: existingDescription || descriptions.description || '',
        descriptionHtml: descriptions.descriptionHtml || '',
      };
    });
  } catch (error) {
    return products;
  }
},
};
