
export const ProductPageDefaultProductMethods = {
initializeDataStructures() {
  const stepsCount = this.selectedBundle.steps.length;

  // Initialize selected products array (one object per step)
  this.selectedProducts = Array(stepsCount).fill(null).map(() => ({}));
  this.selectedProductCategoryIndexes = Array(stepsCount).fill(null).map(() => ({}));

  // Initialize step product data cache
  this.stepProductData = Array(stepsCount).fill(null).map(() => ([]));
  this._stepFetchFailed = {};

  // Seed default steps into selectedProducts regardless of widget style.
  // Default products are always included in the bundle — no user selection required.
  // buildCartItems() reads selectedProducts, so without this the default item is
  // silently excluded from the cart payload on classic modal style bundles.
  this.selectedBundle.steps.forEach((step, i) => {
    if (step.isDefault && step.defaultVariantId) {
      const normalizedDefaultVariantId = this.normalizeSelectionKey(step.defaultVariantId);
      if (normalizedDefaultVariantId) {
        this.setSelectedQuantity(i, normalizedDefaultVariantId, 1);
      }
    }
  });
},

_getDirectDefaultProductsData() {
  const data = this.selectedBundle?.defaultProductsData;
  if (!data || data.isDefaultProductsEnabled !== true || !Array.isArray(data.products)) {
    return null;
  }
  return data;
},

_normalizeDirectDefaultProduct(product) {
  const variant = Array.isArray(product.variants) ? product.variants[0] : null;
  const variantId = this.extractId(variant?.variantGraphqlId || variant?.variantId);
  if (!variantId) return null;

  const imageUrl = product.images?.[0]?.originalSrc || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
  const inventoryQuantity = typeof variant?.inventoryQuantity === 'number'
    ? variant.inventoryQuantity
    : null;
  const price = Number.parseFloat(variant?.price || '0') * 100;
  const requiredQuantity = Number(product.requiredQuantity || 1) || 1;
  const explicitlyUnavailable = variant?.availableForSale === false || variant?.available === false;
  const available = !explicitlyUnavailable;
  const quantityAvailable = inventoryQuantity;

  return {
    id: this.extractId(product.graphqlId || product.productId) || product.productId || variantId,
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
    variants: [{
      id: variantId,
      title: variant?.title || '',
      price,
      compareAtPrice: null,
      available,
      quantityAvailable,
      currentlyNotInStock: false,
    }],
    images: imageUrl ? [{ src: imageUrl }] : [],
    description: '',
  };
},

_getDirectDefaultProductItems() {
  const data = this._getDirectDefaultProductsData();
  if (!data) return [];
  return data.products
    .map(product => this._normalizeDirectDefaultProduct(product))
    .filter(Boolean);
},

_initDirectDefaultProducts() {
  this.directDefaultProducts = this._getDirectDefaultProductItems();
  if (this.directDefaultProducts.length === 0 || !this.selectedProducts[0]) return;

  this.directDefaultProducts.forEach(product => {
    this.setSelectedQuantity(0, product.variantId, product.defaultRequiredQuantity || 1);
  });
},

async _preloadDirectDefaultProducts() {
  if (this.directDefaultProducts.length === 0 || !this.selectedBundle?.steps?.[0]) return;
  await this.loadStepProducts(0).catch(() => {});
},

_mergeDirectDefaultProductsIntoStep(stepIndex, products) {
  if (stepIndex !== 0 || this.directDefaultProducts.length === 0) return products;
  return products.concat(this.directDefaultProducts);
},

_isDirectDefaultVariant(variantId) {
  const normalizedVariantId = this.extractId(variantId);
  return this.directDefaultProducts.some(product => product.variantId === normalizedVariantId);
},

_getDirectDefaultRequiredQuantity(variantId) {
  const normalizedVariantId = this.extractId(variantId);
  const product = this.directDefaultProducts.find(item => item.variantId === normalizedVariantId);
  return product ? (product.defaultRequiredQuantity || 1) : null;
},

/**
 * Pre-fetches product data for all steps marked isDefault so that
 * the filled slot card can render with real image and title on first paint.
 * Non-fatal — a failed fetch just leaves the card in a loading placeholder state.
 */
async _preloadDefaultStepProducts() {
  const promises = this.selectedBundle.steps.map((step, i) => {
    if (step.isDefault && step.defaultVariantId) {
      return this.loadStepProducts(i).catch(() => {});
    }
    return null;
  }).filter(Boolean);
  if (promises.length > 0) await Promise.all(promises);
},

/**
 * Returns the product object for a default step from stepProductData,
 * matched by defaultVariantId. Returns null when not yet loaded.
 */
_getDefaultStepProduct(stepIndex) {
  const step = this.selectedBundle.steps[stepIndex];
  if (!step?.isDefault || !step.defaultVariantId) return null;
  const products = this.stepProductData[stepIndex] || [];
  const variantId = this.normalizeSelectionKey(step.defaultVariantId);
  return this.findProductBySelectionKey(products, variantId) || products[0] || null;
},

/**
 * Show a helpful preview in theme editor when testing on non-bundle products
 */
};
