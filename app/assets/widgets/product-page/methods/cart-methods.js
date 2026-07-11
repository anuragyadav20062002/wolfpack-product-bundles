import { buildCartLineSourceProperties } from '../../shared/engine/cart-lines.js';
import { buildProductPageCartFormData } from '../../shared/engine/cart-submit.js';

function getProductPageSelectedQuantityTotal(selectedProducts = []) {
  return selectedProducts.reduce((sum, stepSelections) => {
    if (!stepSelections || typeof stepSelections !== 'object') return sum;
    return sum + Object.values(stepSelections).reduce((stepSum, quantity) => {
      const value = Number(quantity || 0);
      return stepSum + (Number.isFinite(value) && value > 0 ? value : 0);
    }, 0);
  }, 0);
}

function getProductPageActiveBoxSelectionRule(boxSelection) {
  const rules = Array.isArray(boxSelection?.rules) ? boxSelection.rules : [];
  return boxSelection?.activeRule
    || rules.find(rule => rule?.isDefaultSelected === true)
    || rules[0]
    || null;
}

export const ProductPageCartMethods = {
  async addToCart() {
    try {
      const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
        this.selectedProducts,
        this.stepProductData,
        this.selectedBundle?.steps
      );

      if (totalQuantity === 0) {
        ToastManager.show('Please select products for your bundle before adding to cart.');
        return;
      }

      const allStepsValid = this.selectedBundle.steps.every((step, index) => {
        if (step.isFreeGift || step.isDefault) return true;
        return this.validateStep(index);
      });
      if (!allStepsValid) {
        ToastManager.show('Please complete all bundle steps before adding to cart.');
        return;
      }

      const boxSelectionCheck = this.validateProductPageBoxSelectionCheckout();
      if (!boxSelectionCheck.valid) {
        const template = this._resolveText?.('boxSelectionEligibilityToast_inPage', '')
          || this._resolveText?.('boxSelectionEligibilityToast', '')
          || this._resolveText?.('completeSteps', '');
        ToastManager.show(String(template)
          .replace(/{{boxSelectionDifference}}/g, String(boxSelectionCheck.difference))
          .replace(/{{quantityDifference}}/g, String(boxSelectionCheck.difference))
          .replace(/{{conditionQuantity}}/g, String(boxSelectionCheck.targetQuantity)));
        return;
      }

      const offerId = this.resolveProductPageOfferId();
      const sessionKey = this.generateBundleSessionKey();
      const bundleName = this.selectedBundle?.name || '';
      const cartItems = this.buildCartItems(offerId, sessionKey);

      this.elements.addToCartButton.disabled = true;
      this.elements.addToCartButton.textContent = this._resolveText('addingToCart', 'Adding to Cart...');
      this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);

      const runtimeToken = await this.requestCartTransformRuntimeToken(cartItems, {
        offerGroupId: `${offerId}_${sessionKey}`,
        bundleType: 'product_page',
      });
      const cartContext = this.buildProductPageCartFormData(cartItems, {
        bundleName,
        offerId,
        sessionKey,
        runtimeToken,
      });
      await this.syncBundleDetailsCartMetafield(cartContext.bundleDetailsKey, cartContext.sourceProperties);

      const response = await fetch('/cart/add', {
        method: 'POST',
        body: cartContext.formData
      });
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `Cart add failed (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.description || errorMessage;
        } catch {
          // Response was not JSON, so the status-code message is clearer.
        }
        throw new Error(errorMessage);
      }

      try {
        JSON.parse(responseText);
      } catch {
        // Shopify can return an HTML cart page after a successful multipart add.
      }

      ToastManager.show('Bundle added to cart successfully!');
      this._handlePostAddToCartAction(this._getProductPageControls()?.redirect);
    } catch (error) {
      ToastManager.show('Failed to add bundle to cart: ' + error.message);
    } finally {
      this.hideLoadingOverlay();
      this.updateAddToCartButton();
    }
  },

  validateProductPageBoxSelectionCheckout() {
    const boxSelection = this.selectedBundle?.boxSelection;
    const totalQuantity = getProductPageSelectedQuantityTotal(this.selectedProducts || []);

    if (boxSelection?.validateBoxSelectionQuantity !== true) {
      return { valid: true, totalQuantity, targetQuantity: null, difference: 0 };
    }

    const activeRule = getProductPageActiveBoxSelectionRule(boxSelection);
    const targetQuantity = Number(activeRule?.boxQuantity);
    if (!Number.isFinite(targetQuantity) || targetQuantity < 1) {
      return { valid: true, totalQuantity, targetQuantity: null, difference: 0 };
    }

    return {
      valid: totalQuantity === targetQuantity,
      totalQuantity,
      targetQuantity,
      difference: Math.abs(targetQuantity - totalQuantity),
    };
  },

  buildCartLineSourceProperties(selectedLines) {
    const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      unitPrices
    );
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const discountAmount = Math.max(0, Number(combinedDiscountInfo.discountAmount || 0));
    const discountPercentage = combinedDiscountInfo.discountPercentage
      || (totalPrice > 0 ? (discountAmount / totalPrice) * 100 : 0);

    return buildCartLineSourceProperties({
      selectedLines,
      retailPrice: CurrencyManager.convertAndFormat(totalPrice, currencyInfo),
      discountAmount: discountAmount > 0
        ? CurrencyManager.convertAndFormat(discountAmount, currencyInfo)
        : '',
      discountPercentage,
    });
  },

  buildCartItems(offerId = this.resolveProductPageOfferId(), sessionKey = this.generateBundleSessionKey()) {
    const cartItems = [];
    const unavailableProducts = [];
    const selectedLines = [];
    const baseOfferId = `${String(offerId)}_${String(sessionKey)}`;
    const hasAddonStepConfigured = (this.selectedBundle?.steps || []).some((step) => {
      const addonEval = this.getAddonTierEvaluation?.(step);
      return step?.isFreeGift === true && step?.addonDisplayFree !== true && addonEval?.tier;
    });
    let hasSelectedAddonLine = false;

    this.selectedProducts.forEach((stepSelections, stepIndex) => {
      const productsInStep = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity <= 0) return;
        const product = this.findProductBySelectionKey(productsInStep, variantId);
        if (!product) return;

        if (product.available !== true) {
          unavailableProducts.push(product.title);
          return;
        }

        const step = this.selectedBundle.steps[stepIndex];
        const addonEval = this.getAddonTierEvaluation?.(step) || {};
        const addonDiscount = this.getAddonLineDiscount(step);
        const isChargeableAddonStep = step?.isFreeGift === true && step?.addonDisplayFree !== true;
        const properties = {};
          if (isChargeableAddonStep && addonEval?.tier) {
            hasSelectedAddonLine = true;
            properties._addon_product = 'true';
            properties._addon_offer_id = baseOfferId;
            properties._boxProduct = 'addonProduct';
            if (addonEval?.tier?.tierId) {
              properties._addonTierId = String(addonEval.tier.tierId);
            }
          const addonVariantId = this.extractId(variantId);
          properties._uniqueWpbItemKey = `${addonVariantId || variantId}_pageId:addonProduct`;
          properties._bundle_step_type = addonDiscount && step?.addonDisplayFree !== true
            ? `addon:${addonDiscount.type}:${addonDiscount.value}`
            : 'addon';
        } else if (step?.isFreeGift && step?.addonDisplayFree === true) {
          properties._bundle_step_type = 'free_gift';
        }
        if (step?.isDefault || this._isDirectDefaultVariant(variantId)) {
          properties._bundle_step_type = 'default';
        }

        const cartItem = {
          id: parseInt(this.extractId(variantId)),
          quantity,
          properties
        };
        const sellingPlanAllocationId = this.getSelectedSellingPlanAllocationId(product, variantId);
        if (sellingPlanAllocationId) {
          cartItem.selling_plan = parseInt(sellingPlanAllocationId);
        }

        cartItems.push(cartItem);
        selectedLines.push({ product, quantity });
      });
    });

    if (unavailableProducts.length > 0) {
      const productList = unavailableProducts.join(', ');
      throw new Error(`The following product${unavailableProducts.length > 1 ? 's are' : ' is'} currently unavailable: ${productList}. Please remove ${unavailableProducts.length > 1 ? 'them' : 'it'} from your bundle or try again later.`);
    }

    const sourceProperties = this.buildCartLineSourceProperties(selectedLines);
    cartItems.forEach(item => {
      Object.assign(item.properties, sourceProperties);
      if (hasSelectedAddonLine && hasAddonStepConfigured) {
        item.properties._addon_offer_id = item.properties._addon_offer_id || baseOfferId;
      }
    });

    return cartItems;
  },

  buildProductPageCartFormData(cartItems, {
    bundleName = '',
    offerId = '',
    sessionKey = '',
    runtimeToken = '',
  } = {}) {
    return buildProductPageCartFormData(cartItems, {
      bundleName,
      offerId,
      sessionKey,
      runtimeToken,
    });
  },

  parseRuntimeAddonDiscount(stepType) {
    if (typeof stepType !== 'string') return null;
    const parts = stepType.split(':');
    if (parts.length !== 3 || parts[0] !== 'addon' || String(parts[1]).toUpperCase() !== 'PERCENTAGE') {
      return null;
    }
    const value = Number(parts[2]);
    if (!Number.isFinite(value) || value <= 0) return null;
    return { type: 'PERCENTAGE', value: Math.min(100, value) };
  },

  async requestCartTransformRuntimeToken(cartItems, { offerGroupId, bundleType }) {
    const components = [];
    const addons = [];

    cartItems.forEach((item) => {
      const stepType = item?.properties?._bundle_step_type;
      const isAddon = stepType === 'addon' || (typeof stepType === 'string' && stepType.startsWith('addon:'));
      const line = {
        variantId: item.id,
        quantity: item.quantity,
      };
      if (isAddon) {
        addons.push({
          ...line,
          discount: this.parseRuntimeAddonDiscount(stepType),
        });
      } else {
        components.push(line);
      }
    });

    const response = await fetch('/apps/product-bundles/api/cart-transform-runtime-token', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bundleId: this.selectedBundle?.id,
        bundleType,
        offerGroupId,
        components,
        addons,
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.token) {
      throw new Error(data?.error || 'Unable to validate bundle selection');
    }
    return data.token;
  },

  async syncBundleDetailsCartMetafield(bundleDetailsKey, sourceProperties) {
    try {
      const displayProperties = this.buildBundleDetailsDisplayProperties(sourceProperties);
      if (!bundleDetailsKey || Object.keys(displayProperties).length === 0) return;

      const cartToken = await this.getBundleDetailsCartToken();
      if (!cartToken) return;

      const response = await fetch('/apps/product-bundles/api/cart-bundle-details', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartToken, bundleDetailsKey, displayProperties })
      });

      if (!response.ok) throw new Error(`bundle_details sync failed (${response.status})`);
      const data = await response.json().catch(() => null);
      if (data?.ok !== true) throw new Error(data?.error || 'bundle_details sync failed');
    } catch (error) {
      console.warn('[Wolfpack Bundles] Failed to sync bundle_details cart metafield', error);
    }
  },

  buildBundleDetailsDisplayProperties(sourceProperties) {
    const displayProperties = {};
    const raw = sourceProperties?._bundle_display_properties;
    const cartLineLabels = this.getCartLineLabels();

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.box) displayProperties.Box = String(parsed.box);
        if (parsed?.items) displayProperties[cartLineLabels.items] = String(parsed.items);
        if (parsed?.retailPrice) displayProperties[cartLineLabels.retailPrice] = String(parsed.retailPrice);
        if (parsed?.youSave?.amountPercentage) {
          displayProperties[cartLineLabels.youSave] = String(parsed.youSave.amountPercentage);
        }
      } catch {
        // Cart add must remain non-blocking if display metadata is malformed.
      }
    }

    ['Box', cartLineLabels.items, cartLineLabels.retailPrice, cartLineLabels.youSave, 'Items', 'Retail Price', 'You Save'].forEach((key) => {
      if (sourceProperties?.[key] && !displayProperties[key]) {
        displayProperties[key] = String(sourceProperties[key]);
      }
    });

    return displayProperties;
  },

  getCartLineLabels() {
    const labels = this.config?.sharedCartLabels || {};
    return {
      items: labels.bundleContainsLabel || 'Items',
      retailPrice: labels.bundleOriginalPriceLabel || 'Retail Price',
      youSave: labels.bundleDiscountDisplayLabel || 'You Save',
    };
  },

  async getBundleDetailsCartToken() {
    const response = await fetch('/cart.js?app=wolfpackProductBundles', {
      credentials: 'same-origin'
    });
    if (!response.ok) return null;
    const cart = await response.json();
    return cart?.token || null;
  },

  resolveProductPageOfferId() {
    const rawOfferId = this.selectedBundle?.offerId
      || this.selectedBundle?.bundleOfferId
      || this.selectedBundle?.id
      || 'UNKNOWN';
    const offerId = String(rawOfferId);
    return offerId.startsWith('MIX-') ? offerId : `MIX-${offerId}`;
  },

  generateBundleSessionKey() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const keyLength = 12;
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(keyLength);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
    }

    return Math.random().toString(36).slice(2, 2 + keyLength).toUpperCase().padEnd(keyLength, '0');
  },

  generateBundleInstanceId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${this.selectedBundle.id}_${crypto.randomUUID()}`;
    }

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${this.selectedBundle.id}_${timestamp}_${random}`;
  },
};
