import { BUNDLE_WIDGET } from '../../../bundle-widget-components.js';

export const ProductPageProductDataMethods = {
resolveStorefrontApiBase() {
  const appProxyPrefix = '/apps/product-bundles';
  if (window.location?.pathname?.startsWith(`${appProxyPrefix}/`)) {
    return appProxyPrefix;
  }

  const configuredAppUrl = window.__BUNDLE_APP_URL__ || '';
  const currentOrigin = window.location.origin;
  const currentHost = window.location.host;
  const shopDomain = window.Shopify?.shop || this.container?.dataset.shop || '';

  let configuredAppHost = '';
  if (configuredAppUrl) {
    try {
      configuredAppHost = new URL(configuredAppUrl).host;
    } catch (_error) {
      configuredAppHost = '';
    }
  }

  if (!configuredAppUrl) {
    return appProxyPrefix;
  }

  if (shopDomain && configuredAppHost !== currentHost) {
    return appProxyPrefix;
  }

  return configuredAppUrl || currentOrigin;
},

collectStepProductIds(step) {
  const productIds = [];
  const addProductId = (product) => {
    const id = product?.id || product?.graphqlId || product?.productId;
    if (id && !productIds.includes(id)) productIds.push(id);
  };

  (step.products || []).forEach(addProductId);
  (step.categories || []).forEach(category => {
    (category.products || []).forEach(addProductId);
    (category.selectedProducts || []).forEach(addProductId);
  });

  return productIds;
},

collectStepCollectionHandles(step) {
  const handles = [];
  const addCollectionHandle = (collection) => {
    const handle = collection?.handle;
    if (handle && !handles.includes(handle)) handles.push(handle);
  };

  (step.collections || []).forEach(addCollectionHandle);
  (step.categories || []).forEach(category => {
    (category.collections || []).forEach(addCollectionHandle);
    (category.collectionsData || []).forEach(addCollectionHandle);
    (category.collectionsSelectedData || []).forEach(addCollectionHandle);
  });

  return handles;
},

async loadStepProducts(stepIndex) {
  const step = this.selectedBundle.steps[stepIndex];

  const cachedProducts = this.stepProductData[stepIndex] || [];
  const hasHydratedProducts = cachedProducts.some(product =>
    product?.variantId
    || product?.imageUrl
    || (Array.isArray(product?.variants) && product.variants.length > 0)
    || typeof product?.price === 'number'
  );

  if (cachedProducts.length > 0 && hasHydratedProducts) {
    return;
  }

  let allProducts = [];
  let fetchFailed = false;

  const shop = window.Shopify?.shop || window.location.host;
  const apiBaseUrl = this.resolveStorefrontApiBase();

  const productIds = this.collectStepProductIds(step);
  if (productIds.length > 0) {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productIds.join(','))}&shop=${encodeURIComponent(shop)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.products?.length > 0) allProducts = allProducts.concat(data.products);
      } else {
        fetchFailed = true;
      }
    } catch (_e) {
      fetchFailed = true;
    }
  }

  const handles = this.collectStepCollectionHandles(step);
  if (handles.length > 0) {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/storefront-collections?handles=${encodeURIComponent(handles.join(','))}&shop=${encodeURIComponent(shop)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.products?.length > 0) allProducts = allProducts.concat(data.products);
      } else {
        fetchFailed = true;
      }
    } catch (_e) {
      fetchFailed = true;
    }
  }

  // Process and normalize product data
  const processedProducts = this._mergeDirectDefaultProductsIntoStep(
    stepIndex,
    this.processProductsForStep(allProducts, step)
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

  // Store fetch failure state so renderModalProducts can show a proper error
  if (!this._stepFetchFailed) this._stepFetchFailed = {};
  this._stepFetchFailed[stepIndex] = fetchFailed && this.stepProductData[stepIndex].length === 0;
},

processProductsForStep(products, step) {
  // See full-page widget for the same fields. quantityAvailable is number|null
  // (null = untracked / scope ungranted → treat as unlimited in the clamp).
  const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
    ? this.isInventoryTrackingOnAddToCartEnabled()
    : this._getProductPageControls?.()?.trackInventoryOnAddToCart === true;
  const isTrackedZeroStock = (variant) => (
    variant?.quantityAvailable === 0 && variant?.currentlyNotInStock !== true
  );
  const isVariantSelectableForInventory = (variant) => (
    variant?.available === true && (
      !trackInventoryOnAddToCart || !isTrackedZeroStock(variant)
    )
  );
  const toCents = (value) => Math.round(parseFloat(value || '0') * 100);
  const normalizeVariant = (v) => ({
    id: this.extractId(v.id),
    title: v.title,
    price: toCents(v.price),
    compareAtPrice: v.compareAtPrice ? toCents(v.compareAtPrice) : null,
    sellingPlanAllocations: Array.isArray(v.sellingPlanAllocations)
      ? v.sellingPlanAllocations
      : [],
    available: isVariantSelectableForInventory(v),
    quantityAvailable: typeof v.quantityAvailable === 'number' ? v.quantityAvailable : null,
    currentlyNotInStock: v.currentlyNotInStock === true,
    option1: v.option1 || null,
    option2: v.option2 || null,
    option3: v.option3 || null,
    image: v.image || null
  });

  return products.flatMap(product => {
    if (step.displayVariantsAsIndividual && product.variants && product.variants.length > 0) {
      // Display each variant as separate product - filter out unavailable variants
      // Preserve parent product reference for variant selection and tracking
      const processedVariants = (product.variants || []).map(normalizeVariant);

      const processedOptions = (product.options || []).map(opt => {
        if (typeof opt === 'string') return opt;
        return opt.name || opt;
      });

      return product.variants
        .map(variant => {
          // Storefront API: prioritize variant image, fallback to product featured image
          const imageUrl = variant?.image?.src || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

          return {
            id: this.extractId(variant.id),
            title: `${product.title} - ${variant.title}`,
            imageUrl,
            price: toCents(variant.price),
            compareAtPrice: variant.compareAtPrice ? toCents(variant.compareAtPrice) : null,
            variantId: this.extractId(variant.id),
            available: isVariantSelectableForInventory(variant),
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
      // Display product with the first available variant when variants are not separate cards.
      // If all variants are unavailable, keep the configured product visible and
      // render it as out of stock instead of turning a valid DTO into a load error.
      const defaultVariant = product.variants?.find(isVariantSelectableForInventory)
        || product.variants?.[0]
        || null;

      // Storefront API: prioritize variant image, fallback to product featured image
      const imageUrl = defaultVariant?.image?.src || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

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
          price: defaultVariant
            ? toCents(defaultVariant.price)
            : toCents(product.price),
          compareAtPrice: defaultVariant?.compareAtPrice ? toCents(defaultVariant.compareAtPrice) : null,
          variantId: this.extractId(defaultVariant?.id || product.id),
          sellingPlanAllocations: defaultVariant?.sellingPlanAllocations || [],
          available: defaultVariant ? isVariantSelectableForInventory(defaultVariant) : false,
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
}
};
