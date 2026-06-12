import { buildCartLineSourceProperties } from '../../shared/engine/cart-lines.js';
import { buildProductPageCartFormData } from '../../shared/engine/cart-submit.js';

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

      const cartItems = this.buildCartItems();

      this.elements.addToCartButton.disabled = true;
      this.elements.addToCartButton.textContent = this._resolveText('addingToCart', 'Adding to Cart...');
      this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);

      const cartContext = this.buildProductPageCartFormData(cartItems);
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
      ToastManager.show(`Failed to add bundle to cart: ${error.message}`);
    } finally {
      this.hideLoadingOverlay();
      this.updateAddToCartButton();
    }
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

  buildCartItems() {
    const cartItems = [];
    const unavailableProducts = [];
    const selectedLines = [];

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
        const addonDiscount = this.getAddonLineDiscount(step);
        const properties = {};
        if (addonDiscount && step?.addonDisplayFree !== true) {
          properties._bundle_step_type = `addon:${addonDiscount.type}:${addonDiscount.value}`;
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
    });

    return cartItems;
  },

  buildProductPageCartFormData(cartItems) {
    return buildProductPageCartFormData(cartItems, {
      bundleName: this.selectedBundle?.name || '',
      offerId: this.resolveProductPageOfferId(),
      sessionKey: this.generateBundleSessionKey(),
    });
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
    return Math.random().toString(36).slice(2, 5).toUpperCase();
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
